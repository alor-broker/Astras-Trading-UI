import {Range} from '@terminal-core-lib/common/types/range.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {OrderBookScaleHelper} from '@terminal-widgets-lib/widgets/scalper-order-book/utils/order-book-scale.helper';
import {PriceOptions} from '@terminal-widgets-lib/widgets/scalper-order-book/utils/price-rows-store';
import {ScalperOrderBookConstants} from '@terminal-widgets-lib/widgets/scalper-order-book/constants/scalper-order-book.constants';
import {PriceGridDescriptor} from './price-grid-types';

/** Границы цен сторон ордербука. */
export interface OrderBookBounds {
  asksRange: Range | null;
  bidsRange: Range | null;
}

/**
 * Чистая математика бесконечной виртуальной ценовой сетки.
 *
 * Дублирует расчёт диапазона из `DataContextBuilder` (намеренно: новый виджет
 * самодостаточен и не материализует строки), но работает за O(1) на строку.
 * Grid-индексы знаковые: 0 = стартовая цена, рост индекса = убывание цены.
 */
export class PriceGridMath {
  /** Множитель максимального отклонения цены. Совпадает с DataContextBuilder. */
  static readonly priceDeviationMultiplier = 20000;

  /** Цена строки сетки по grid-индексу. */
  static priceAtIndex(descriptor: PriceGridDescriptor, gridIndex: number): number {
    return MathHelper.round(
      descriptor.startPrice - gridIndex * descriptor.scaledStep,
      descriptor.pricePrecision
    );
  }

  /** Базовый диапазон цены строки (разворачивает масштаб обратно к шагу инструмента). */
  static baseRangeAtIndex(descriptor: PriceGridDescriptor, gridIndex: number): Range {
    return OrderBookScaleHelper.scaledPriceToOriginal(
      this.priceAtIndex(descriptor, gridIndex),
      descriptor.basePriceStep,
      descriptor.scaleFactor
    );
  }

  /** Grid-индекс ближайшей строки к указанной цене (инверсия priceAtIndex, знаковый). */
  static nearestIndexByPrice(descriptor: PriceGridDescriptor, price: number): number {
    return Math.round((descriptor.startPrice - price) / descriptor.scaledStep);
  }

  static isMinorLinePrice(price: number, descriptor: PriceGridDescriptor): boolean {
    return MathHelper.isMultipleOf(price, descriptor.minorLineValue);
  }

  static isMajorLinePrice(price: number, descriptor: PriceGridDescriptor): boolean {
    return MathHelper.isMultipleOf(price, descriptor.majorLineValue);
  }

  static getOrderBookBounds(orderBookData: OrderbookData): OrderBookBounds {
    let asksRange: Range | null = null;
    if (orderBookData.a.length > 0) {
      asksRange = {
        min: orderBookData.a[0].p,
        max: orderBookData.a[orderBookData.a.length - 1].p
      };
    }

    let bidsRange: Range | null = null;
    if (orderBookData.b.length > 0) {
      bidsRange = {
        min: orderBookData.b[orderBookData.b.length - 1].p,
        max: orderBookData.b[0].p
      };
    }

    return {asksRange, bidsRange};
  }

  /**
   * Опорная цена и шаг сетки по границам ордербука. Порт `DataContextBuilder.getPriceOptions`
   * без расчёта expectedRange* (бесконечной сетке границы диапазона не нужны).
   */
  static getPriceOptions(
    bounds: OrderBookBounds | null,
    priceStep: number,
    scaleFactor: number,
    majorLinesStep: number
  ): PriceOptions | null {
    if (bounds == null) {
      return null;
    }

    const bestAsk = bounds.asksRange?.min ?? bounds.bidsRange?.max;
    const bestBid = bounds.bidsRange?.max ?? bounds.asksRange?.min;

    if (bestAsk == null || bestBid == null) {
      return null;
    }

    const startPrice = OrderBookScaleHelper.getStartPrice(bestAsk, bestBid, priceStep, scaleFactor, majorLinesStep);

    return {
      startPrice: startPrice.startPrice,
      scaledStep: startPrice.step,
      basePriceStep: priceStep,
      scaleFactor,
      expectedRangeMin: startPrice.startPrice,
      expectedRangeMax: startPrice.startPrice
    };
  }

  /** Кратность minor-линий по масштабированному шагу и настройке. */
  static getMinorLineValue(scaledStep: number, minorLinesStep: number | undefined): number {
    return MathHelper.round(
      scaledStep * (minorLinesStep ?? ScalperOrderBookConstants.defaultMinorLinesStep),
      MathHelper.getPrecision(scaledStep)
    );
  }

  /** Кратность major-линий по масштабированному шагу и настройке. */
  static getMajorLineValue(scaledStep: number, majorLinesStep: number | undefined): number {
    return MathHelper.round(
      scaledStep * (majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep),
      MathHelper.getPrecision(scaledStep)
    );
  }
}
