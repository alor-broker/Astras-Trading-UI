/**
 * gets object property by path
 * ```typescript
 *  const a = {b: { c: 1}};
 *  getProperty(a, 'b.c') // 1
 * ```
 *
 * @param obj target object
 * @param path property path through '.'
 *
 * @returns object property value
 */
export function getPropertyFromPath(obj: any, path: string): any {
  const pathArr = path.split('.');

  if (pathArr.length > 1) {
    return getPropertyFromPath(obj[pathArr[0]], pathArr.slice(1).join('.'));
  } else {
    return obj[pathArr[0]];
  }
}
