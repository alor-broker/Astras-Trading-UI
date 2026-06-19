import {BodyRow} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  DisplayModel,
  PriceGridDescriptor
} from './price-grid-types';
import {PriceGridMath} from './price-grid-math';

/**
 * Источник цен по индексу для контроллера прокрутки (бесконечная виртуальная сетка).
 * Display-индексы знаковые и не ограничены: `minIndex` = -Infinity (бесконечно вверх,
 * более высокие цены), `maxIndex` = +Infinity (бесконечно вниз, вплоть до отрицательных цен).
 */
export interface PriceSource {
  readonly isEmpty: boolean;
  readonly minIndex: number;
  readonly maxIndex: number;

  priceAt(displayIndex: number): number;

  nearestIndexByPrice(price: number): number;
}

/**
 * Обёртка над {@link DisplayModel}: материализует строку по display-индексу
 * (аффинные зоны - по формуле, активная зона - из готового списка) и переводит
 * между display-индексом, ценой и grid-индексом.
 *
 * Display-индекс совпадает с grid-индексом в верхней аффинной зоне (схлопывания там нет);
 * ниже активной зоны сдвинут на число схлопнутых строк (`drops`). Все операции O(1)
 * либо O(размера активной зоны).
 */
export class DisplaySource implements PriceSource {
  readonly isEmpty = false;

  readonly minIndex = Number.NEGATIVE_INFINITY;

  readonly maxIndex = Number.POSITIVE_INFINITY;

  private readonly model: DisplayModel;

  private readonly descriptor: PriceGridDescriptor;

  private readonly activeStart: number;

  private readonly activeLength: number;

  private readonly drops: number;

  constructor(model: DisplayModel) {
    this.model = model;
    this.activeStart = model.activeStartGrid;
    this.activeLength = model.active.length;
    this.drops = (model.activeEndGrid - model.activeStartGrid + 1) - this.activeLength;

    this.descriptor = {
      instrumentKey: model.instrumentKey,
      startPrice: model.startPrice,
      scaledStep: model.scaledStep,
      pricePrecision: model.pricePrecision,
      basePriceStep: model.basePriceStep,
      scaleFactor: model.scaleFactor,
      minorLineValue: model.minorLineValue,
      majorLineValue: model.majorLineValue,
      isDirty: model.isDirty
    };
  }

  get maxAskBidVolume(): number {
    return this.model.maxAskBidVolume;
  }

  /** Display-индекс строки для начального центрирования / выравнивания. */
  get centerIndex(): number {
    return this.model.centerDisplayIndex;
  }

  priceAt(displayIndex: number): number {
    if (displayIndex >= this.activeStart && displayIndex < this.activeStart + this.activeLength) {
      return this.model.active[displayIndex - this.activeStart].price;
    }

    return PriceGridMath.priceAtIndex(this.descriptor, this.toGridIndex(displayIndex));
  }

  /** Материализует строку по display-индексу. */
  rowAt(displayIndex: number): BodyRow {
    if (displayIndex >= this.activeStart && displayIndex < this.activeStart + this.activeLength) {
      return this.model.active[displayIndex - this.activeStart];
    }

    const rowType = displayIndex < this.activeStart
      ? this.model.affineTopRowType
      : this.model.affineBottomRowType;
    return this.buildAffineRow(this.toGridIndex(displayIndex), rowType);
  }

  nearestIndexByPrice(price: number): number {
    const gridIndex = PriceGridMath.nearestIndexByPrice(this.descriptor, price);

    if (gridIndex < this.model.activeStartGrid) {
      return gridIndex;
    }

    if (gridIndex > this.model.activeEndGrid) {
      return gridIndex - this.drops;
    }

    // В активной зоне ищем ближайшую по цене оставленную строку.
    let bestLocal = 0;
    let bestDelta = Number.MAX_VALUE;
    for (let i = 0; i < this.activeLength; i++) {
      const delta = Math.abs(this.model.active[i].price - price);
      if (delta < bestDelta) {
        bestDelta = delta;
        bestLocal = i;
      }
    }

    return this.activeLength > 0 ? this.activeStart + bestLocal : this.activeStart;
  }

  /** Display-индекс -> grid-индекс (для аффинных зон). */
  private toGridIndex(displayIndex: number): number {
    if (displayIndex < this.activeStart) {
      return displayIndex;
    }

    // Нижняя аффинная зона: сдвиг на число схлопнутых строк.
    return displayIndex + this.drops;
  }

  private buildAffineRow(gridIndex: number, rowType: BodyRow['rowType']): BodyRow {
    const price = PriceGridMath.priceAtIndex(this.descriptor, gridIndex);
    const positionRange = this.model.positionRange;

    return {
      price,
      isStartRow: gridIndex === 0,
      baseRange: PriceGridMath.baseRangeAtIndex(this.descriptor, gridIndex),
      isFiller: false,
      isMinorLinePrice: PriceGridMath.isMinorLinePrice(price, this.descriptor),
      isMajorLinePrice: PriceGridMath.isMajorLinePrice(price, this.descriptor),
      rowType,
      currentPositionRangeSign: positionRange != null && price >= positionRange.min && price <= positionRange.max
        ? positionRange.sign
        : null
    };
  }
}
