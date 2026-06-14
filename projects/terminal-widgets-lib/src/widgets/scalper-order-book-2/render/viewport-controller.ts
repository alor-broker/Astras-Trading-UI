import {
  ViewportMetrics,
  VisibleRange
} from './render-contracts';

/**
 * Управляет вертикальной прокруткой списка строк стакана.
 * Прокрутка виртуальная: канва имеет фиксированный размер,
 * смещение определяет, какие строки видимы.
 */
export class ViewportController {
  private width = 0;

  private height = 0;

  private rowHeight = 18;

  private fontSize = 12;

  private scrollOffsetValue = 0;

  private rowsCount = 0;

  private anchorPrice: number | null = null;

  /** Дробное смещение прокрутки относительно верха якорной строки. */
  private anchorSubRowOffset = 0;

  private animationTargetOffset: number | null = null;

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
    this.rowHeight = Math.max(1, rowHeight);
    this.fontSize = fontSize;
    this.clampScrollOffset();
  }

  /**
   * Обновляет количество строк, сохраняя видимую позицию по цене якорной строки.
   * @param rows цены строк по убыванию
   */
  setRows(rows: { price: number }[]): void {
    const previousAnchor = this.anchorPrice;
    this.rowsCount = rows.length;

    if (rows.length === 0) {
      this.anchorPrice = null;
      this.scrollOffsetValue = 0;
      this.animationTargetOffset = null;
      return;
    }

    if (previousAnchor != null) {
      const anchorIndex = this.findNearestRowIndex(rows, previousAnchor);
      if (anchorIndex != null) {
        const expectedOffset = (anchorIndex * this.rowHeight) + this.anchorSubRowOffset;

        // Смещение корректируется только если якорная строка реально сдвинулась
        // (например, ценовой ряд расширен сверху). Иначе обновление данных
        // не должно влиять на прокрутку и анимацию.
        if (Math.abs(expectedOffset - this.scrollOffsetValue) >= 0.5) {
          this.scrollOffsetValue = expectedOffset;
          this.animationTargetOffset = null;
        }
      }
    }

    this.clampScrollOffset();
    this.updateAnchor(rows);
  }

  scrollBy(deltaPx: number, rows: { price: number }[]): void {
    this.animationTargetOffset = null;
    this.scrollOffsetValue += deltaPx;
    this.clampScrollOffset();
    this.updateAnchor(rows);
  }

  /** Центрирует указанную строку в видимой области. */
  centerOnIndex(index: number, rows: { price: number }[], animate: boolean): void {
    const targetOffset = this.clampOffsetValue(
      (index * this.rowHeight) - (this.height / 2) + (this.rowHeight / 2)
    );

    if (animate) {
      this.animationTargetOffset = targetOffset;
    } else {
      this.animationTargetOffset = null;
      this.scrollOffsetValue = targetOffset;
      this.updateAnchor(rows);
    }
  }

  /**
   * Продвигает анимацию прокрутки на один кадр.
   * @returns true, если анимация продолжается и требуются дополнительные кадры
   */
  advanceAnimation(rows: { price: number }[]): boolean {
    if (this.animationTargetOffset == null) {
      return false;
    }

    const target = this.clampOffsetValue(this.animationTargetOffset);
    const distance = target - this.scrollOffsetValue;

    if (Math.abs(distance) <= 1) {
      this.scrollOffsetValue = target;
      this.animationTargetOffset = null;
      this.updateAnchor(rows);
      return false;
    }

    // Экспоненциальное приближение: быстро в начале, плавно в конце.
    this.scrollOffsetValue += distance * 0.25;
    this.updateAnchor(rows);
    return true;
  }

  getVisibleRange(): VisibleRange | null {
    if (this.rowsCount === 0 || this.height <= 0) {
      return null;
    }

    const start = Math.max(0, Math.floor(this.scrollOffsetValue / this.rowHeight));
    const end = Math.min(
      this.rowsCount - 1,
      Math.ceil((this.scrollOffsetValue + this.height) / this.rowHeight) - 1
    );

    if (end < start) {
      return null;
    }

    return {start, end};
  }

  /** Индекс строки по координате Y канвы. */
  getRowIndexByY(y: number): number | null {
    if (this.rowsCount === 0 || this.rowHeight <= 0) {
      return null;
    }

    const index = Math.floor((this.scrollOffsetValue + y) / this.rowHeight);
    if (index < 0 || index >= this.rowsCount) {
      return null;
    }

    return index;
  }

  /** Координата Y верха строки в координатах канвы. */
  getRowY(index: number): number {
    return (index * this.rowHeight) - this.scrollOffsetValue;
  }

  private findNearestRowIndex(rows: { price: number }[], price: number): number | null {
    if (rows.length === 0) {
      return null;
    }

    // Строки отсортированы по убыванию цены.
    let low = 0;
    let high = rows.length - 1;

    if (price >= rows[0].price) {
      return 0;
    }

    if (price <= rows[high].price) {
      return high;
    }

    while (low < high - 1) {
      const mid = (low + high) >> 1;
      if (rows[mid].price > price) {
        low = mid;
      } else {
        high = mid;
      }
    }

    return Math.abs(rows[low].price - price) <= Math.abs(rows[high].price - price)
      ? low
      : high;
  }

  private updateAnchor(rows: { price: number }[]): void {
    if (rows.length === 0) {
      this.anchorPrice = null;
      this.anchorSubRowOffset = 0;
      return;
    }

    const topIndex = Math.min(
      rows.length - 1,
      Math.max(0, Math.round(this.scrollOffsetValue / this.rowHeight))
    );

    this.anchorPrice = rows[topIndex].price;
    this.anchorSubRowOffset = this.scrollOffsetValue - (topIndex * this.rowHeight);
  }

  private clampScrollOffset(): void {
    this.scrollOffsetValue = this.clampOffsetValue(this.scrollOffsetValue);
  }

  private clampOffsetValue(value: number): number {
    const maxOffset = Math.max(0, (this.rowsCount * this.rowHeight) - this.height);
    return Math.min(Math.max(0, value), maxOffset);
  }
}
