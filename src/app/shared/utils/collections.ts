/**
 * Find unique elements and applies a selector, which can create a new object from provided one
 * @param array array
 * @param selector a function with gets an element of array and returns same or diffrent object, constructed from this element
 * @returns array of unique objects
 */
export function findUnique<T, P>(array: Array<T>, selector: (element: T) => P) : P[] {
  const selected = array.map(element => JSON.stringify(selector(element)));
  return [...new Set(selected)].map(j => JSON.parse(j));
}

/**
 * Function that removes all duplicates in provided array and also sort it
 * @param {Array<T>} array Provided array with duplicates.
 * @param {(e1: T, e2: T) => number} sorter A usual function for sorting which you provide to array.sort()
 * @param {(first: T, second: T) => boolean} comparer A comparer function
 * @returns array of unique and sorted elements
 * */
export function findUniqueElements<T>(
    array: Array<T>,
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

type sortArg<T> = keyof T | `-${string & keyof T}`;

/**
 * Returns a comparator for objects of type T that can be used by sort
 * functions, were T objects are compared by the specified T properties.
 *
 * @param sortBy - the names of the properties to sort by, in precedence order.
 *                 Prefix any name with `-` to sort it in descending order.
 */
export function byPropertiesOf<T extends object> (sortBy: Array<sortArg<T>>) {
    function compareByProperty (arg: sortArg<T>) {
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
        return function (a: T, b: T) {
            const result = a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0;

            return result * sortOrder;
        };
    }

    return function (obj1: T, obj2: T) {
        let i = 0;
        let result = 0;
        const numberOfProperties = sortBy?.length;
        while (result === 0 && i < numberOfProperties) {
            result = compareByProperty(sortBy[i])(obj1, obj2);
            i++;
        }

        return result;
    };
}

/**
 * Check if 2 arrays are equal, not by references, but by elements
 * @param array1 first array
 * @param array2 second array *
 * @returns true if equal
 */
export function scalarArrayEqual<T>(array1: Array<T>, array2: Array<T>) : boolean {
  return array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}
