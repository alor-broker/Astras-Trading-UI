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
  if(obj == null) {
    return undefined;
  }

  const pathArr = path.split('.');

  if (pathArr.length > 1) {
    if(obj[pathArr[0]] == null) {
      return undefined;
    }
    return getPropertyFromPath(obj[pathArr[0]], pathArr.slice(1).join('.'));
  } else {
    return obj[pathArr[0]];
  }
}

/**
 * @param value value to check
 * @param defaultValue default value
 *
 * @returns source value if not null or default value
 */
export function getValueOrDefault<T>(value: T | null, defaultValue: T): T {
  return value ?? defaultValue;
}
