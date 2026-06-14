import {
  beforeEach,
  describe,
  expect,
  it
} from 'vitest';
import {ViewportController} from './viewport-controller';

describe('ViewportController', () => {
  let controller: ViewportController;

  const createRows = (maxPrice: number, count: number, step = 1): { price: number }[] => {
    const rows: { price: number }[] = [];
    for (let i = 0; i < count; i++) {
      rows.push({price: maxPrice - (i * step)});
    }

    return rows;
  };

  beforeEach(() => {
    controller = new ViewportController();
    controller.setSize(300, 100);
    controller.setGridSettings(10, 12);
  });

  describe('getVisibleRange', () => {
    it('should return null when there are no rows', () => {
      controller.setRows([]);

      expect(controller.getVisibleRange()).toBeNull();
    });

    it('should return rows fitting the viewport from the scroll offset', () => {
      const rows = createRows(100, 50);
      controller.setRows(rows);
      controller.scrollBy(105, rows);

      const range = controller.getVisibleRange();

      expect(range).toEqual({start: 10, end: 20});
    });

    it('should clamp the range to the last row', () => {
      const rows = createRows(100, 12);
      controller.setRows(rows);

      const range = controller.getVisibleRange();

      expect(range).toEqual({start: 0, end: 9});
    });
  });

  describe('getRowIndexByY', () => {
    it('should map canvas y to absolute row index', () => {
      const rows = createRows(100, 50);
      controller.setRows(rows);
      controller.scrollBy(100, rows);

      expect(controller.getRowIndexByY(0)).toBe(10);
      expect(controller.getRowIndexByY(25)).toBe(12);
    });

    it('should return null when y is outside the rows list', () => {
      const rows = createRows(100, 5);
      controller.setRows(rows);

      expect(controller.getRowIndexByY(60)).toBeNull();
    });
  });

  describe('setRows anchoring', () => {
    it('should keep the scroll offset when the same rows are set again', () => {
      const rows = createRows(100, 50);
      controller.setRows(rows);
      controller.scrollBy(103, rows);

      controller.setRows([...rows]);

      expect(controller.scrollOffset).toBe(103);
    });

    it('should shift the scroll offset when rows are prepended', () => {
      const rows = createRows(100, 50);
      controller.setRows(rows);
      controller.scrollBy(103, rows);

      const extendedRows = [...createRows(105, 5), ...rows];
      controller.setRows(extendedRows);

      expect(controller.scrollOffset).toBe(153);
    });

    it('should not shift the scroll offset when rows are appended at the bottom', () => {
      const rows = createRows(100, 50);
      controller.setRows(rows);
      controller.scrollBy(103, rows);

      const extendedRows = [...rows, ...createRows(50, 10)];
      controller.setRows(extendedRows);

      expect(controller.scrollOffset).toBe(103);
    });

    it('should reset the scroll offset when rows become empty', () => {
      const rows = createRows(100, 50);
      controller.setRows(rows);
      controller.scrollBy(100, rows);

      controller.setRows([]);

      expect(controller.scrollOffset).toBe(0);
    });
  });

  describe('centerOnIndex', () => {
    it('should center the requested row in the viewport', () => {
      const rows = createRows(100, 100);
      controller.setRows(rows);

      controller.centerOnIndex(50, rows, false);

      // 50 * 10 - 100 / 2 + 10 / 2
      expect(controller.scrollOffset).toBe(455);
    });

    it('should clamp the offset to the rows bounds', () => {
      const rows = createRows(100, 20);
      controller.setRows(rows);

      controller.centerOnIndex(19, rows, false);

      expect(controller.scrollOffset).toBe(100);
    });
  });

  describe('advanceAnimation', () => {
    it('should approach the animation target and stop near it', () => {
      const rows = createRows(100, 100);
      controller.setRows(rows);

      controller.centerOnIndex(50, rows, true);

      expect(controller.isAnimating).toBe(true);
      expect(controller.scrollOffset).toBe(0);

      let isAnimating = true;
      for (let i = 0; i < 100 && isAnimating; i++) {
        isAnimating = controller.advanceAnimation(rows);
      }

      expect(isAnimating).toBe(false);
      expect(controller.scrollOffset).toBe(455);
    });
  });

  describe('scrollBy', () => {
    it('should clamp the scroll offset to the rows bounds', () => {
      const rows = createRows(100, 20);
      controller.setRows(rows);

      controller.scrollBy(-50, rows);
      expect(controller.scrollOffset).toBe(0);

      controller.scrollBy(10000, rows);
      expect(controller.scrollOffset).toBe(100);
    });
  });
});
