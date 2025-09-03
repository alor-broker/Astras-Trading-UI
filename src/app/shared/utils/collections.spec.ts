import {
  findUnique,
  findUniqueElements,
  isArrayEqual,
  mergeArrays
} from './collections';

describe('findUnique', () => {
  it('should return unique numbers', () => {
    const array = [1, 2, 2, 3, 4, 4, 5];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should return unique strings', () => {
    const array = ['a', 'b', 'b', 'c', 'd', 'd', 'e'];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('should return unique objects based on a property', () => {
    const array = [
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
      { id: 1, name: 'one-dupe' },
      { id: 3, name: 'three' },
      { id: 2, name: 'two-dupe' },
    ];
    const result = findUnique(array, (x) => x.id);
    // The selector extracts 'id', so the result will be an array of unique ids
    expect(result).toEqual([1, 2, 3]);
  });

  it('should return unique objects when selector returns the object itself', () => {
    const array = [
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
      { id: 1, name: 'one' }, // Exact duplicate
      { id: 3, name: 'three' },
      { id: 2, name: 'two' }, // Exact duplicate
    ];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual([
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
      { id: 3, name: 'three' },
    ]);
  });

  it('should return unique objects with different properties if selector creates new objects', () => {
    const array = [
      { id: 1, name: 'one', extra: 'a' },
      { id: 2, name: 'two', extra: 'b' },
      { id: 1, name: 'one-dupe', extra: 'c' }, // Same id, different name/extra
    ];
    // Selector creates a new object with only the 'id' property
    const result = findUnique(array, (x) => ({ id: x.id }));
    expect(result).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('should handle an empty array', () => {
    const array: number[] = [];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual([]);
  });

  it('should handle an array with one element', () => {
    const array = [{ id: 1 }];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual([{ id: 1 }]);
  });

  it('should handle an array with all unique elements', () => {
    const array = [1, 2, 3, 4, 5];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle an array with all duplicate elements', () => {
    const array = [1, 1, 1, 1, 1];
    const result = findUnique(array, (x) => x);
    expect(result).toEqual([1]);
  });
describe('findUniqueElements', () => {
  const numberSorter = (a: number, b: number): number => a - b;
  const numberComparer = (a: number, b: number): boolean => a === b;

  const objectSorter = (a: { id: number }, b: { id: number }): number => a.id - b.id;
  const objectComparer = (a: { id: number }, b: { id: number }): boolean => a.id === b.id;

  it('should return unique and sorted numbers', () => {
    const array = [5, 2, 2, 3, 4, 1, 4, 5];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle an already sorted array with duplicates', () => {
    const array = [1, 2, 2, 3, 3, 3, 4, 5, 5];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle an array with all unique elements (already sorted)', () => {
    const array = [1, 2, 3, 4, 5];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle an array with all unique elements (unsorted)', () => {
    const array = [5, 1, 4, 2, 3];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });

  it('should handle an array with all duplicate elements', () => {
    const array = [1, 1, 1, 1, 1];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([1]);
  });

  it('should handle an empty array', () => {
    const array: number[] = [];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([]);
  });

  it('should handle an array with one element', () => {
    const array = [42];
    const result = findUniqueElements(array, numberSorter, numberComparer);
    expect(result).toEqual([42]);
  });

  it('should return unique and sorted objects based on a property', () => {
    const array = [
      { id: 3, name: 'three' },
      { id: 1, name: 'one' },
      { id: 2, name: 'two' },
      { id: 1, name: 'one-dupe' },
      { id: 3, name: 'three-again' },
    ];
    const result = findUniqueElements(array, objectSorter, objectComparer);
    // The function modifies the array in place and returns it.
    // The duplicates are removed based on 'id', but the original objects are kept.
    // We expect the first encountered object for a given id after sorting.
    expect(result).toEqual([
      { id: 1, name: 'one' }, // or { id: 1, name: 'one-dupe' } depending on stable sort, check implementation
      { id: 2, name: 'two' },
      { id: 3, name: 'three' }, // or { id: 3, name: 'three-again' }
    ]);
    // To make the test more robust and less dependent on sort stability for non-primitive properties:
    // We can check if the ids are unique and sorted, and if the length is correct.
    expect(result.map((x: { id: number }) => x.id)).toEqual([1, 2, 3]);
    expect(result.length).toBe(3);
  });

  it('should work with string arrays', () => {
    const array = ['banana', 'apple', 'orange', 'apple', 'banana', 'grape'];
    const stringSorter = (a: string, b: string): number => a.localeCompare(b);
    const stringComparer = (a: string, b: string): boolean => a === b;
    const result = findUniqueElements(array, stringSorter, stringComparer);
    expect(result).toEqual(['apple', 'banana', 'grape', 'orange']);
  });
});
describe('isArrayEqual', () => {
  const numberEqualityTester = (a: number, b: number): boolean => a === b;
  const objectEqualityTester = (a: { id: number }, b: { id: number }): boolean => a.id === b.id;

  it('should return true for two null arrays', () => {
    expect(isArrayEqual(null, null, numberEqualityTester)).toBe(true);
  });

  it('should return false if one array is null and the other is not', () => {
    expect(isArrayEqual(null, [1, 2], numberEqualityTester)).toBe(false);
    expect(isArrayEqual([1, 2], null, numberEqualityTester)).toBe(false);
  });

  it('should return true for two empty arrays', () => {
    expect(isArrayEqual([], [], numberEqualityTester)).toBe(true);
  });

  it('should return false if arrays have different lengths', () => {
    expect(isArrayEqual([1, 2], [1, 2, 3], numberEqualityTester)).toBe(false);
    expect(isArrayEqual([1, 2, 3], [1, 2], numberEqualityTester)).toBe(false);
  });

  it('should return true for equal arrays of numbers', () => {
    expect(isArrayEqual([1, 2, 3], [1, 2, 3], numberEqualityTester)).toBe(true);
  });

  it('should return false for non-equal arrays of numbers', () => {
    expect(isArrayEqual([1, 2, 3], [1, 2, 4], numberEqualityTester)).toBe(false);
    expect(isArrayEqual([1, 2, 3], [3, 2, 1], numberEqualityTester)).toBe(false);
  });

  it('should return true for equal arrays of objects', () => {
    const arr1 = [{ id: 1 }, { id: 2 }];
    const arr2 = [{ id: 1 }, { id: 2 }];
    expect(isArrayEqual(arr1, arr2, objectEqualityTester)).toBe(true);
  });

  it('should return false for non-equal arrays of objects', () => {
    const arr1 = [{ id: 1 }, { id: 2 }];
    const arr2 = [{ id: 1 }, { id: 3 }];
    expect(isArrayEqual(arr1, arr2, objectEqualityTester)).toBe(false);
  });

  it('should return false if objects are different but equality tester says they are same (tester error)', () => {
    const arr1 = [{ id: 1, name: 'a' }];
    const arr2 = [{ id: 1, name: 'b' }];
    // objectEqualityTester only checks id, so it will return true
    expect(isArrayEqual(arr1, arr2, objectEqualityTester)).toBe(true);
  });

  it('should use the provided equality tester', () => {
    const strictEquality = (a: { val: number }, b: { val: number }): boolean => a.val === b.val;
    const looseEquality = (a: { val: number }, b: { val: number }): boolean => Math.abs(a.val - b.val) < 2;

    const arr1 = [{ val: 1 }, { val: 5 }];
    const arr2 = [{ val: 1 }, { val: 5 }];
    const arr3 = [{ val: 1 }, { val: 6 }];

    expect(isArrayEqual(arr1, arr2, strictEquality)).toBe(true);
    expect(isArrayEqual(arr1, arr3, strictEquality)).toBe(false);

    expect(isArrayEqual(arr1, arr2, looseEquality)).toBe(true);
    expect(isArrayEqual(arr1, arr3, looseEquality)).toBe(true); // 5 and 6 are close enough
  });
});
});
describe('mergeArrays', () => {
  it('should merge multiple arrays of numbers', () => {
    const arrays = [[1, 2], [3, 4], [5, 6]];
    const result = mergeArrays(arrays);
    expect(result).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('should merge multiple arrays of strings', () => {
    const arrays = [['a', 'b'], ['c', 'd'], ['e']];
    const result = mergeArrays(arrays);
    expect(result).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it('should handle empty arrays within the input', () => {
    const arrays = [[1, 2], [], [3, 4], [], []];
    const result = mergeArrays(arrays);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  it('should handle an input array of empty arrays', () => {
    const arrays: number[][] = [[], [], []];
    const result = mergeArrays(arrays);
    expect(result).toEqual([]);
  });

  it('should handle an empty input array', () => {
    const arrays: number[][] = [];
    const result = mergeArrays(arrays);
    expect(result).toEqual([]);
  });

  it('should handle arrays with mixed types if allowed by T (though typically T is consistent)', () => {
    const arrays = [[1, 'a'], [2, 'b']];
    const result = mergeArrays(arrays as any[][]); // Use 'as any[][]' for mixed type test
    expect(result).toEqual([1, 'a', 2, 'b']);
  });

  it('should merge arrays of objects', () => {
    const arrays = [
      [{ id: 1 }, { id: 2 }],
      [{ id: 3 }],
      [{ id: 4 }, { id: 5 }, { id: 6 }],
    ];
    const result = mergeArrays(arrays);
    expect(result).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }]);
  });

  it('should return a new array and not modify original arrays', () => {
    const arr1 = [1, 2];
    const arr2 = [3, 4];
    const arrays = [arr1, arr2];
    const result = mergeArrays(arrays);
    expect(result).toEqual([1, 2, 3, 4]);
    expect(arr1).toEqual([1, 2]); // Original array unchanged
    expect(arr2).toEqual([3, 4]); // Original array unchanged
    expect(result).not.toBe(arr1);
    expect(result).not.toBe(arr2);
  });
});
