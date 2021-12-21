export function findUnique<T, P>(array: Array<T>, selector: (element: T) => P) : P[] {
  const selected = array.map(element => JSON.stringify(selector(element)));
  return [...new Set(selected)].map(j => JSON.parse(j));
}
