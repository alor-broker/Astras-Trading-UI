import {Range} from '@terminal-core-lib/common/types/range.types';
import {
  OrderbookData,
  OrderbookDataRow
} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {
  BodyRow,
  ScalperOrderBookRowType
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  DisplayModel,
  PositionPriceRange,
  PriceGridDescriptor
} from './price-grid-types';
import {
  OrderBookBounds,
  PriceGridMath
} from './price-grid-math';

/** Настройки, влияющие на построение строк отображения. */
export interface DisplayModelSettings {
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
}

interface MatchedVolume {
  volume: number;
  isBest: boolean;
  growingVolume: number;
}

/**
 * Строит {@link DisplayModel} из дескриптора бесконечной сетки, ордербука и позиции.
 *
 * Порт `DataContextBuilder.mapPriceRowToOrderBook` / `mapToPosition`, но проекция строк
 * ордербука выполняется только по ограниченной активной зоне (спан ордербука),
 * а не по всему ценовому ряду. Логика схлопывания пустых уровней
 * (`showZeroVolumeItems` / `showSpreadItems`) сохранена.
 */
export class DisplayModelBuilder {
  static build(
    descriptor: PriceGridDescriptor,
    orderBook: OrderbookData,
    position: Position | null,
    settings: DisplayModelSettings
  ): DisplayModel {
    const bounds = PriceGridMath.getOrderBookBounds(orderBook);
    const positionRange = this.computePositionRange(position, bounds);

    const base: Omit<DisplayModel, 'activeStartGrid' | 'activeEndGrid' | 'active'
      | 'affineTopRowType' | 'affineBottomRowType' | 'centerDisplayIndex' | 'maxAskBidVolume'> = {
      instrumentKey: descriptor.instrumentKey,
      startPrice: descriptor.startPrice,
      scaledStep: descriptor.scaledStep,
      pricePrecision: descriptor.pricePrecision,
      basePriceStep: descriptor.basePriceStep,
      scaleFactor: descriptor.scaleFactor,
      minorLineValue: descriptor.minorLineValue,
      majorLineValue: descriptor.majorLineValue,
      positionRange,
      isDirty: descriptor.isDirty
    };

    // Нет данных ордербука: вся сетка - плоская аффинная зона без типа и объёма.
    if (bounds.asksRange == null && bounds.bidsRange == null) {
      return {
        ...base,
        activeStartGrid: 0,
        activeEndGrid: -1,
        active: [],
        affineTopRowType: null,
        affineBottomRowType: null,
        centerDisplayIndex: 0,
        maxAskBidVolume: 0
      };
    }

    const activePriceMax = bounds.asksRange?.max ?? bounds.bidsRange!.max;
    const activePriceMin = bounds.bidsRange?.min ?? bounds.asksRange!.min;

    // Запас по краям перекрывает разброс baseRange при масштабе (±floor(scale/2) шага).
    const margin = descriptor.scaleFactor + 2;
    const activeStartGrid = PriceGridMath.nearestIndexByPrice(descriptor, activePriceMax) - margin;
    const activeEndGrid = PriceGridMath.nearestIndexByPrice(descriptor, activePriceMin) + margin;

    const active: BodyRow[] = [];
    let maxAskBidVolume = 0;
    // Локальные позиции в active[] (= display-индекс минус activeStartGrid).
    let firstSpreadLocal = -1;
    let spreadCount = 0;
    let bestAskLocal = -1;
    let bestBidLocal = -1;

    for (let gridIndex = activeStartGrid; gridIndex <= activeEndGrid; gridIndex++) {
      const row = this.mapActiveRow(descriptor, gridIndex, orderBook, bounds, positionRange, settings);
      if (row == null) {
        continue;
      }

      maxAskBidVolume = Math.max(maxAskBidVolume, row.askVolume ?? 0, row.bidVolume ?? 0);

      const localIndex = active.length;
      const rowType = row.rowType ?? null;
      if (rowType === ScalperOrderBookRowType.Spread || rowType === ScalperOrderBookRowType.Mixed) {
        if (firstSpreadLocal < 0) {
          firstSpreadLocal = localIndex;
        }
        spreadCount++;
      }

      if (bestAskLocal < 0 && rowType === ScalperOrderBookRowType.Ask && row.isBest === true) {
        bestAskLocal = localIndex;
      }

      if (bestBidLocal < 0 && rowType === ScalperOrderBookRowType.Bid && row.isBest === true) {
        bestBidLocal = localIndex;
      }

      active.push(row);
    }

    return {
      ...base,
      activeStartGrid,
      activeEndGrid,
      active,
      affineTopRowType: bounds.asksRange != null ? ScalperOrderBookRowType.Ask : null,
      affineBottomRowType: bounds.bidsRange != null ? ScalperOrderBookRowType.Bid : null,
      centerDisplayIndex: this.resolveCenterDisplayIndex(activeStartGrid, active.length, firstSpreadLocal, spreadCount, bestAskLocal, bestBidLocal),
      maxAskBidVolume
    };
  }

  /** Display-индекс цели центрирования: середина спреда -> лучший ask -> bid -> середина активной зоны. */
  private static resolveCenterDisplayIndex(
    activeStartGrid: number,
    activeLength: number,
    firstSpreadLocal: number,
    spreadCount: number,
    bestAskLocal: number,
    bestBidLocal: number
  ): number {
    if (firstSpreadLocal >= 0) {
      return activeStartGrid + firstSpreadLocal + Math.round(spreadCount / 2);
    }

    if (bestAskLocal >= 0) {
      return activeStartGrid + bestAskLocal;
    }

    if (bestBidLocal >= 0) {
      return activeStartGrid + bestBidLocal;
    }

    return activeStartGrid + Math.floor(activeLength / 2);
  }

  /** Диапазон цен текущей позиции. Порт `DataContextBuilder.mapToPosition`. */
  private static computePositionRange(position: Position | null, bounds: OrderBookBounds): PositionPriceRange | null {
    if (position == null || position.qtyTFuture === 0) {
      return null;
    }

    const basePrice = position.qtyTFuture > 0
      ? bounds.bidsRange?.max ?? bounds.asksRange?.min
      : bounds.asksRange?.min ?? bounds.bidsRange?.max;

    if (basePrice == null) {
      return null;
    }

    const sign = position.qtyTFuture > 0 ? 1 : -1;

    return {
      min: Math.min(basePrice, position.avgPrice),
      max: Math.max(basePrice, position.avgPrice),
      sign: (basePrice - position.avgPrice) * sign
    };
  }

  /** Строит строку активной зоны по grid-индексу. Возвращает null, если уровень схлопнут. */
  private static mapActiveRow(
    descriptor: PriceGridDescriptor,
    gridIndex: number,
    orderBook: OrderbookData,
    bounds: OrderBookBounds,
    positionRange: PositionPriceRange | null,
    settings: DisplayModelSettings
  ): BodyRow | null {
    const price = PriceGridMath.priceAtIndex(descriptor, gridIndex);
    const baseRange = PriceGridMath.baseRangeAtIndex(descriptor, gridIndex);

    const resultRow: BodyRow = {
      price,
      isStartRow: gridIndex === 0,
      baseRange,
      isFiller: false,
      isMinorLinePrice: PriceGridMath.isMinorLinePrice(price, descriptor),
      isMajorLinePrice: PriceGridMath.isMajorLinePrice(price, descriptor),
      currentPositionRangeSign: null
    };

    this.applyPosition(resultRow, positionRange);

    const isAskSide = bounds.asksRange != null && baseRange.max >= bounds.asksRange.min;
    const isBidSide = bounds.bidsRange != null && baseRange.min <= bounds.bidsRange.max;

    if (isAskSide && isBidSide) {
      resultRow.rowType = ScalperOrderBookRowType.Mixed;
      resultRow.askVolume = this.matchRow(baseRange, orderBook.a)?.volume ?? 0;
      resultRow.bidVolume = this.matchRow(baseRange, orderBook.b)?.volume ?? 0;
      resultRow.volume = Math.round(resultRow.askVolume + resultRow.bidVolume);
      resultRow.isBest = true;
      return resultRow;
    }

    if (isAskSide) {
      resultRow.rowType = ScalperOrderBookRowType.Ask;
      if (baseRange.min <= bounds.asksRange!.max) {
        const matched = this.matchRow(baseRange, orderBook.a);
        if (matched == null) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          } else {
            return null;
          }
        } else {
          resultRow.volume = matched.volume;
          resultRow.askVolume = resultRow.volume;
          resultRow.growingVolume = matched.growingVolume;
          resultRow.isBest = matched.isBest;
        }
      }

      return resultRow;
    }

    if (isBidSide) {
      resultRow.rowType = ScalperOrderBookRowType.Bid;
      if (baseRange.max >= bounds.bidsRange!.min) {
        const matched = this.matchRow(baseRange, orderBook.b);
        if (matched == null) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          } else {
            return null;
          }
        } else {
          resultRow.volume = matched.volume;
          resultRow.bidVolume = resultRow.volume;
          resultRow.growingVolume = matched.growingVolume;
          resultRow.isBest = matched.isBest;
        }
      }

      return resultRow;
    }

    if (bounds.asksRange != null && bounds.bidsRange != null && settings.showSpreadItems) {
      resultRow.rowType = ScalperOrderBookRowType.Spread;
      return resultRow;
    }

    if (bounds.asksRange == null || bounds.bidsRange == null) {
      return resultRow;
    }

    return null;
  }

  private static applyPosition(row: BodyRow, positionRange: PositionPriceRange | null): void {
    if (positionRange != null && row.price >= positionRange.min && row.price <= positionRange.max) {
      row.currentPositionRangeSign = positionRange.sign;
    }
  }

  /** Сопоставляет строки ордербука диапазону цены строки. Порт matchRow. */
  private static matchRow(baseRange: Range, source: OrderbookDataRow[]): MatchedVolume | null {
    let volume = 0;
    let growingVolumeAcc = 0;
    let matchedGrowing = 0;
    let isBest = false;
    let hasMatch = false;
    const isSinglePrice = baseRange.min === baseRange.max;

    for (let index = 0; index < source.length; index++) {
      const row = source[index];
      growingVolumeAcc += row.v;

      if (row.p >= baseRange.min && row.p <= baseRange.max) {
        hasMatch = true;
        volume = Math.round(volume + row.v);
        matchedGrowing = Math.round(matchedGrowing + (index === 0 ? 0 : growingVolumeAcc));
        if (index === 0) {
          isBest = true;
        }

        if (isSinglePrice) {
          break;
        }
      }
    }

    return hasMatch ? {volume, isBest, growingVolume: matchedGrowing} : null;
  }
}
