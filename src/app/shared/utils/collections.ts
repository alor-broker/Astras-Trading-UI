/**
 * Find unique elements and applies a selector, which can create a new object from provided one
 * @param array array
 * @param selector a function with gets an element of array and returns same or different object, constructed from this element
 * @returns array of unique objects
 */
export function findUnique<T, P>(array: T[], selector: (element: T) => P): P[] {
  const selected = array.map(element => JSON.stringify(selector(element)));
  return [...new Set(selected)].map(j => JSON.parse(j) as P);
}

/**
 * Function that removes all duplicates in provided array and also sort it
 * @param {Array<T>} array Provided array with duplicates.
 * @param {(e1: T, e2: T) => number} sorter A usual function for sorting which you provide to array.sort()
 * @param {(first: T, second: T) => boolean} comparer A comparer function
 * @returns array of unique and sorted elements
 * */
export function findUniqueElements<T>(
    array: T[],
    sorter: (e1: T, e2: T) => number,
    comparer: (first: T, second: T) => boolean): T[]
{
  if (array.length === 0) {
    return array;
  }

  array.sort(sorter);

  let writeIndex = 1; // Points to the position for the next unique element
  for (let readIndex = 1; readIndex < array.length; readIndex++) {
    // Compare current element with the last unique element added
    if (!comparer(array[readIndex], array[writeIndex - 1])) {
      // If it's not a duplicate, copy it to the writeIndex position
      if (writeIndex !== readIndex) { // Avoid self-assignment if no duplicates were skipped yet
         array[writeIndex] = array[readIndex];
      }
      writeIndex++;
    }
  }
  array.length = writeIndex;
  return array;
}

/**
 * Determines if the provided arrays are equal to each other, using the provided equality tester
 * that is called for all entries in the array.
 */
export function isArrayEqual<T>(a: readonly T[] | null, b: readonly T[] | null, equalityTester: (a: T, b: T) => boolean): boolean {
  if (a === null || b === null) {
    return a === b;
  }

  if (a.length !== b.length) {
    return false;
  }

  return !a.some((item, index) => !equalityTester(item, b[index]));
}

/**
 * Return array with valued from input arrays
 */
export function mergeArrays<T>(arrays: T[][]): T[] {
  return arrays.reduce(
    (acc, curr) => {
      return [
        ...acc,
        ...curr
      ];
    },
    []
  );
}
