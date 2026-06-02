export class ArrayHelper {
  static mergeArrays<T>(arrays: T[][]): T[] {
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

  static isArrayEqual<T>(a: readonly T[] | null, b: readonly T[] | null, equalityTester: (a: T, b: T) => boolean): boolean {
    if (a === null || b === null) {
      return a === b;
    }

    if (a.length !== b.length) {
      return false;
    }

    return !a.some((item, index) => !equalityTester(item, b[index]));
  }

  static findUniqueElements<T>(
    array: T[],
    sorter: (e1: T, e2: T) => number,
    comparer: (first: T, second: T) => boolean): T[] {
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

  static lastOrNull<T>(source: T[]): T | null {
    if (source.length === 0) {
      return null;
    }
    return source[source.length - 1];
  }

  static firstOrNull<T>(source: T[]): T | null {
    if (source.length === 0) {
      return null;
    }
    return source[0];
  }

  static findUnique<T, P>(array: T[], selector: (element: T) => P): P[] {
    const selected = array.map(element => JSON.stringify(selector(element)));
    return Array.from(new Set(selected)).map(j => JSON.parse(j) as P);
  }
}

export class CustomIteratorWrapper<T> implements Iterable<T> {
  constructor(private readonly factory: () => Iterator<T>) {
  }

  [Symbol.iterator](): Iterator<T> {
    return this.factory();
  }
}
