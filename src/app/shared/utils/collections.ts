/**
 * Find unique elements and applies a selector, which can create a new object from provided one
 * @param array array
 * @param selector a function with gets an element of array and returns same or diffrent object, constructed from this element
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
    comparer: (first: T, second: T) => boolean) : T[]
{
  array.sort(sorter);
  let dupes = 0;
  for (let i = 1; i < array.length; i++)
  {
      if (comparer(array[i], array[i - 1]))
      {
      dupes++;
    }
    array[i - dupes] = array[i];
  }
  array.length -= dupes;
  return array;
}

type SortArg<T> = keyof T | `-${string & keyof T}`;

/**
 * Returns a comparator for objects of type T that can be used by sort
 * functions, were T objects are compared by the specified T properties.
 *
 * @param sortBy - the names of the properties to sort by, in precedence order.
 *                 Prefix any name with `-` to sort it in descending order.
 */
export function byPropertiesOf<T extends object>(sortBy: SortArg<T>[]): (obj1: T, obj2: T) => number {
  function compareByProperty(arg: SortArg<T>): (a: T, b: T) => number {
    let key: keyof T;
    let sortOrder = 1;
    if (typeof arg === 'string' && arg.startsWith('-')) {
      sortOrder = -1;
      // Typescript is not yet smart enough to infer that substring is keyof T
      key = arg.substr(1) as keyof T;
    } else {
      // Likewise it is not yet smart enough to infer that arg is not keyof T
      key = arg as keyof T;
    }
    return function (a: T, b: T): number {
      const result = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;

      return result * sortOrder;
    };
  }

  return function (obj1: T, obj2: T): number {
    let i = 0;
    let result = 0;
    const numberOfProperties = sortBy.length;
    while (result === 0 && i < numberOfProperties) {
      result = compareByProperty(sortBy[i])(obj1, obj2);
      i++;
    }

    return result;
  };
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
