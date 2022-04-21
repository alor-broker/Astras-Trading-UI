export function findUnique<T, P>(array: Array<T>, selector: (element: T) => P) : P[] {
  const selected = array.map(element => JSON.stringify(selector(element)));
  return [...new Set(selected)].map(j => JSON.parse(j));
}

export function findUniqueElements<T>(
    array: Array<T>,
    sorter: (e1: T, e2: T) => number,
    comparer: (first: T, seconds: T) => boolean) : T[]
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

export function scalarArrayEqual<T>(array1: Array<T>, array2: Array<T>) {
  array1.length === array2.length && array1.every((value, index) => value === array2[index]);
}
