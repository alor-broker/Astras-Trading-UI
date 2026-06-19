import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import {ViewportController} from './viewport-controller';
import {PriceSource} from './price-grid/display-source';

describe('ViewportController', () => {
  let controller: ViewportController;

  /** Источник цен на основе массива (для тестов виртуального источника). */
  const createSource = (rows: { price: number }[]): PriceSource => ({
    isEmpty: rows.length === 0,
    minIndex: 0,
    maxIndex: rows.length - 1,
    priceAt: (index: number): number => rows[index].price,
    nearestIndexByPrice: (price: number): number => {
      if (rows.length === 0) {
        return 0;
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
  });

  const createRows = (maxPrice: number, count: number, step = 1): { price: number }[] => {
    const rows: { price: number }[] = [];
    for (let i = 0; i < count; i++) {
      rows.push({price: maxPrice - (i * step)});
    }

    return rows;
  };

  /** Бесконечный в обе стороны источник: индекс 0 = startPrice, без границ прокрутки. */
  const createInfiniteSource = (startPrice: number, step: number): PriceSource => ({
    isEmpty: false,
    minIndex: Number.NEGATIVE_INFINITY,
    maxIndex: Number.POSITIVE_INFINITY,
    priceAt: (index: number): number => startPrice - (index * step),
    nearestIndexByPrice: (price: number): number => Math.round((startPrice - price) / step)
  });

  beforeEach(() => {
    controller = new ViewportController();
    controller.setSize(300, 100);
    controller.setGridSettings(10, 12);
  });

  describe('getVisibleRange', () => {
    it('should return null when there are no rows', () => {
      controller.setSource(createSource([]));

      expect(controller.getVisibleRange()).toBeNull();
    });

    it('should return rows fitting the viewport from the scroll offset', () => {
      const source = createSource(createRows(100, 50));
      controller.setSource(source);
      controller.scrollBy(105, source);

      const range = controller.getVisibleRange();

      expect(range).toEqual({start: 10, end: 20});
    });

    it('should clamp the range to the last row', () => {
      const source = createSource(createRows(100, 12));
      controller.setSource(source);

      const range = controller.getVisibleRange();

      expect(range).toEqual({start: 0, end: 9});
    });
  });

  describe('getRowIndexByY', () => {
    it('should map canvas y to absolute row index', () => {
      const source = createSource(createRows(100, 50));
      controller.setSource(source);
      controller.scrollBy(100, source);

      expect(controller.getRowIndexByY(0)).toBe(10);
      expect(controller.getRowIndexByY(25)).toBe(12);
    });

    it('should return null when y is outside the rows list', () => {
      const source = createSource(createRows(100, 5));
      controller.setSource(source);

      expect(controller.getRowIndexByY(60)).toBeNull();
    });
  });

  describe('setSource anchoring', () => {
    it('should keep the scroll offset when the same rows are set again', () => {
      const rows = createRows(100, 50);
      const source = createSource(rows);
      controller.setSource(source);
      controller.scrollBy(103, source);

      controller.setSource(createSource([...rows]));

      expect(controller.scrollOffset).toBe(103);
    });

    it('should shift the scroll offset when rows are prepended', () => {
      const rows = createRows(100, 50);
      const source = createSource(rows);
      controller.setSource(source);
      controller.scrollBy(103, source);

      const extendedRows = [...createRows(105, 5), ...rows];
      controller.setSource(createSource(extendedRows));

      expect(controller.scrollOffset).toBe(153);
    });

    it('should not shift the scroll offset when rows are appended at the bottom', () => {
      const rows = createRows(100, 50);
      const source = createSource(rows);
      controller.setSource(source);
      controller.scrollBy(103, source);

      const extendedRows = [...rows, ...createRows(50, 10)];
      controller.setSource(createSource(extendedRows));

      expect(controller.scrollOffset).toBe(103);
    });

    it('should reset the scroll offset when rows become empty', () => {
      const rows = createRows(100, 50);
      const source = createSource(rows);
      controller.setSource(source);
      controller.scrollBy(100, source);

      controller.setSource(createSource([]));

      expect(controller.scrollOffset).toBe(0);
    });
  });

  describe('centerOnIndex', () => {
    it('should center the requested row in the viewport', () => {
      const source = createSource(createRows(100, 100));
      controller.setSource(source);

      controller.centerOnIndex(50, source, false);

      // 50 * 10 - 100 / 2 + 10 / 2
      expect(controller.scrollOffset).toBe(455);
    });

    it('should clamp the offset to the rows bounds', () => {
      const source = createSource(createRows(100, 20));
      controller.setSource(source);

      controller.centerOnIndex(19, source, false);

      expect(controller.scrollOffset).toBe(100);
    });
  });

  describe('advanceAnimation', () => {
    it('should approach the animation target and stop near it', () => {
      const source = createSource(createRows(100, 100));
      controller.setSource(source);

      controller.centerOnIndex(50, source, true);

      expect(controller.isAnimating).toBe(true);
      expect(controller.scrollOffset).toBe(0);

      let isAnimating = true;
      for (let i = 0; i < 100 && isAnimating; i++) {
        isAnimating = controller.advanceAnimation(source);
      }

      expect(isAnimating).toBe(false);
      expect(controller.scrollOffset).toBe(455);
    });
  });

  describe('scrollBy', () => {
    it('should clamp the scroll offset to the rows bounds', () => {
      const source = createSource(createRows(100, 20));
      controller.setSource(source);

      controller.scrollBy(-50, source);
      expect(controller.scrollOffset).toBe(0);

      controller.scrollBy(10000, source);
      expect(controller.scrollOffset).toBe(100);
    });
  });

  describe('infinite scroll', () => {
    it('should scroll up into negative indices (higher prices) without a top clamp', () => {
      const source = createInfiniteSource(100, 1);
      controller.setSource(source);

      controller.scrollBy(-500, source);
      expect(controller.scrollOffset).toBe(-500);

      const range = controller.getVisibleRange();
      expect(range).toEqual({start: -50, end: -41});
    });

    it('should scroll down without a bottom clamp (prices can be negative)', () => {
      const source = createInfiniteSource(100, 1);
      controller.setSource(source);

      controller.scrollBy(1_000_000, source);
      expect(controller.scrollOffset).toBe(1_000_000);

      // Видимые строки соответствуют отрицательным ценам ниже нуля.
      const range = controller.getVisibleRange()!;
      expect(source.priceAt(range.start)).toBeLessThan(0);
    });
  });

  describe('setGridSettings', () => {
    it('should keep the anchored price row in place when row height changes', () => {
      const source = createInfiniteSource(100, 1);
      controller.setSource(source);
      // Прокрутка к строке с индексом 30 (цена 70).
      controller.scrollBy(300, source);

      controller.setGridSettings(20, 12);

      // Якорная строка 30 при новой высоте строки: 30 * 20 = 600.
      expect(controller.scrollOffset).toBe(600);
      expect(controller.getVisibleRange()?.start).toBe(30);
    });
  });
});
