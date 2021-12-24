export function findUnique<T, P>(array: Array<T>, selector: (element: T) => P) : P[] {
  const selected = array.map(element => JSON.stringify(selector(element)));
  return [...new Set(selected)].map(j => JSON.parse(j));
}

export function findUniqueElements<T, P>(
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
