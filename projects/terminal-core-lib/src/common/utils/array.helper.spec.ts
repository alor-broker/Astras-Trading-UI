import {ArrayHelper} from './array.helper';

describe('ArrayHelper', () => {
  describe('mergeArrays', () => {
    it('should flatten an array of arrays preserving order', () => {
      expect(ArrayHelper.mergeArrays([[1, 2], [3], [4, 5]])).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return an empty array when there is nothing to merge', () => {
      expect(ArrayHelper.mergeArrays([])).toEqual([]);
    });
  });

  describe('isArrayEqual', () => {
    const numberEquals = (a: number, b: number): boolean => a === b;

    it('should return true for two equal arrays', () => {
      expect(ArrayHelper.isArrayEqual([1, 2, 3], [1, 2, 3], numberEquals)).toBe(true);
    });

    it('should return false for arrays of different length', () => {
      expect(ArrayHelper.isArrayEqual([1, 2], [1, 2, 3], numberEquals)).toBe(false);
    });

    it('should return false when an element differs', () => {
      expect(ArrayHelper.isArrayEqual([1, 2, 3], [1, 9, 3], numberEquals)).toBe(false);
    });

    it('should treat two nulls as equal but null vs array as not equal', () => {
      expect(ArrayHelper.isArrayEqual(null, null, numberEquals)).toBe(true);
      expect(ArrayHelper.isArrayEqual(null, [1], numberEquals)).toBe(false);
      expect(ArrayHelper.isArrayEqual([1], null, numberEquals)).toBe(false);
    });
  });

  describe('findUniqueElements', () => {
    const sorter = (a: number, b: number): number => a - b;
    const comparer = (a: number, b: number): boolean => a === b;

    it('should sort and remove duplicates in place', () => {
      expect(ArrayHelper.findUniqueElements([3, 1, 2, 1, 3], sorter, comparer)).toEqual([1, 2, 3]);
    });

    it('should return an empty array unchanged', () => {
      expect(ArrayHelper.findUniqueElements([], sorter, comparer)).toEqual([]);
    });

    it('should keep a single-element array intact', () => {
      expect(ArrayHelper.findUniqueElements([42], sorter, comparer)).toEqual([42]);
    });
  });

  describe('lastOrNull', () => {
    it('should return the last element', () => {
      expect(ArrayHelper.lastOrNull([1, 2, 3])).toBe(3);
    });

    it('should return null for an empty array', () => {
      expect(ArrayHelper.lastOrNull([])).toBeNull();
    });
  });

  describe('firstOrNull', () => {
    it('should return the first element', () => {
      expect(ArrayHelper.firstOrNull([1, 2, 3])).toBe(1);
    });

    it('should return null for an empty array', () => {
      expect(ArrayHelper.firstOrNull([])).toBeNull();
    });
  });

  describe('findUnique', () => {
    it('should return unique selected values', () => {
      const source = [{id: 1}, {id: 2}, {id: 1}];

      expect(ArrayHelper.findUnique(source, x => x.id)).toEqual([1, 2]);
    });

    it('should deduplicate by deep structural equality of the selected value', () => {
      const source = [{key: {a: 1}}, {key: {a: 1}}, {key: {a: 2}}];

      expect(ArrayHelper.findUnique(source, x => x.key)).toEqual([{a: 1}, {a: 2}]);
    });
  });
});
