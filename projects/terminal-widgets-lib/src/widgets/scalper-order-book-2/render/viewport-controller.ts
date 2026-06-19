import {
  ViewportMetrics,
  VisibleRange
} from './render-contracts';
import {PriceSource} from './price-grid/display-source';

/**
 * Управляет вертикальной прокруткой списка строк стакана.
 * Прокрутка виртуальная и бесконечная: канва имеет фиксированный размер,
 * смещение определяет, какие строки видимы.
 *
 * Источник цен ({@link PriceSource}) виртуален: цена строки по знаковому индексу
 * вычисляется по формуле. Прокрутка не ограничена сверху (`minIndex = -Infinity`,
 * более высокие цены) и ограничена снизу строкой с минимальной ценой > 0 (`maxIndex`).
 */
export class ViewportController {
  private width = 0;

  private height = 0;

  private rowHeight = 18;

  private fontSize = 12;

  private scrollOffsetValue = 0;

  private isEmpty = true;

  private minIndex = Number.NEGATIVE_INFINITY;

  private maxIndex = Number.POSITIVE_INFINITY;

  private anchorPrice: number | null = null;

  /** Дробное смещение прокрутки относительно верха якорной строки. */
  private anchorSubRowOffset = 0;

  private animationTargetOffset: number | null = null;

  private lastSource: PriceSource | null = null;

  get scrollOffset(): number {
    return this.scrollOffsetValue;
  }

  get metrics(): ViewportMetrics {
    return {
      width: this.width,
      height: this.height,
      rowHeight: this.rowHeight,
      fontSize: this.fontSize,
      scrollOffset: this.scrollOffsetValue
    };
  }

  get isAnimating(): boolean {
    return this.animationTargetOffset != null;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.clampScrollOffset();
  }

  setGridSettings(rowHeight: number, fontSize: number): void {
    const oldRowHeight = this.rowHeight;
    this.rowHeight = Math.max(1, rowHeight);
    this.fontSize = fontSize;

    const source = this.lastSource;
    // Высота строки меняет px-на-строку, поэтому сохраняем видимую цену якорной строки,
    // иначе ценовой ряд «прыгнет» под курсором.
    if (source != null && !source.isEmpty && this.anchorPrice != null && oldRowHeight > 0) {
      const anchorIndex = source.nearestIndexByPrice(this.anchorPrice);
      const scaledSubOffset = this.anchorSubRowOffset * (this.rowHeight / oldRowHeight);
      this.scrollOffsetValue = (anchorIndex * this.rowHeight) + scaledSubOffset;
      this.clampScrollOffset();
      this.updateAnchor(source);
    } else {
      this.clampScrollOffset();
    }
  }

  /**
   * Обновляет источник строк, сохраняя видимую позицию по цене якорной строки.
   */
  setSource(source: PriceSource): void {
    const previousAnchor = this.anchorPrice;
    this.lastSource = source;
    this.isEmpty = source.isEmpty;
    this.minIndex = source.minIndex;
    this.maxIndex = source.maxIndex;

    if (source.isEmpty) {
      this.anchorPrice = null;
      this.scrollOffsetValue = 0;
      this.animationTargetOffset = null;
      return;
    }

    if (previousAnchor != null) {
      const anchorIndex = source.nearestIndexByPrice(previousAnchor);
      const expectedOffset = (anchorIndex * this.rowHeight) + this.anchorSubRowOffset;

      // Смещение корректируется только если якорная строка реально сдвинулась
      // (например, из-за схлопывания уровней выше). Иначе обновление данных
      // не должно влиять на прокрутку.
      if (Math.abs(expectedOffset - this.scrollOffsetValue) >= 0.5) {
        const delta = expectedOffset - this.scrollOffsetValue;
        this.scrollOffsetValue = expectedOffset;
        // Анимация выравнивания не прерывается: цель сдвигается вместе со смещением,
        // продолжая вести к той же логической строке.
        if (this.animationTargetOffset != null) {
          this.animationTargetOffset += delta;
        }
      }
    }

    this.clampScrollOffset();
    this.updateAnchor(source);
  }

  scrollBy(deltaPx: number, source: PriceSource): void {
    this.animationTargetOffset = null;
    this.scrollOffsetValue += deltaPx;
    this.clampScrollOffset();
    this.updateAnchor(source);
  }

  /** Центрирует указанную строку в видимой области. */
  centerOnIndex(index: number, source: PriceSource, animate: boolean): void {
    const targetOffset = this.clampOffsetValue(
      (index * this.rowHeight) - (this.height / 2) + (this.rowHeight / 2)
    );

    if (animate) {
      this.animationTargetOffset = targetOffset;
    } else {
      this.animationTargetOffset = null;
      this.scrollOffsetValue = targetOffset;
      this.updateAnchor(source);
    }
  }

  /**
   * Продвигает анимацию прокрутки на один кадр.
   * @returns true, если анимация продолжается и требуются дополнительные кадры
   */
  advanceAnimation(source: PriceSource): boolean {
    if (this.animationTargetOffset == null) {
      return false;
    }

    const target = this.clampOffsetValue(this.animationTargetOffset);
    const distance = target - this.scrollOffsetValue;

    if (Math.abs(distance) <= 1) {
      this.scrollOffsetValue = target;
      this.animationTargetOffset = null;
      this.updateAnchor(source);
      return false;
    }

    // Экспоненциальное приближение: быстро в начале, плавно в конце.
    this.scrollOffsetValue += distance * 0.25;
    this.updateAnchor(source);
    return true;
  }

  getVisibleRange(): VisibleRange | null {
    if (this.isEmpty || this.height <= 0) {
      return null;
    }

    const start = Math.max(this.minIndex, Math.floor(this.scrollOffsetValue / this.rowHeight));
    const end = Math.min(
      this.maxIndex,
      Math.ceil((this.scrollOffsetValue + this.height) / this.rowHeight) - 1
    );

    if (end < start) {
      return null;
    }

    return {start, end};
  }

  /** Индекс строки по координате Y канвы (знаковый). */
  getRowIndexByY(y: number): number | null {
    if (this.isEmpty || this.rowHeight <= 0) {
      return null;
    }

    const index = Math.floor((this.scrollOffsetValue + y) / this.rowHeight);
    if (index < this.minIndex || index > this.maxIndex) {
      return null;
    }

    return index;
  }

  /** Координата Y верха строки в координатах канвы. */
  getRowY(index: number): number {
    return (index * this.rowHeight) - this.scrollOffsetValue;
  }

  private updateAnchor(source: PriceSource): void {
    if (source.isEmpty) {
      this.anchorPrice = null;
      this.anchorSubRowOffset = 0;
      return;
    }

    const topIndex = Math.min(
      this.maxIndex,
      Math.max(this.minIndex, Math.round(this.scrollOffsetValue / this.rowHeight))
    );

    this.anchorPrice = source.priceAt(topIndex);
    this.anchorSubRowOffset = this.scrollOffsetValue - (topIndex * this.rowHeight);
  }

  private clampScrollOffset(): void {
    this.scrollOffsetValue = this.clampOffsetValue(this.scrollOffsetValue);
  }

  private clampOffsetValue(value: number): number {
    // Бесконечно вверх (minOffset = -Infinity при minIndex = -Infinity),
    // ограничено снизу строкой с минимальной ценой.
    const minOffset = this.minIndex * this.rowHeight;
    const maxOffset = ((this.maxIndex + 1) * this.rowHeight) - this.height;
    return Math.min(Math.max(minOffset, value), Math.max(minOffset, maxOffset));
  }
}
