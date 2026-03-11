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
/**
 * Gets object property by path
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
export function getPropertyFromPath<T extends Record<string, unknown> | null | undefined>(obj: T, path: string): unknown {
  if(obj == null) {
    return undefined;
  }

  const pathArr = path.split('.');

  if (pathArr.length > 1) {
    const firstKey = pathArr[0];
    const objValue = obj as Record<string, unknown>;
    if(objValue[firstKey] == null) {
      return undefined;
    }

    const nestedObj = objValue[firstKey];
    if (typeof nestedObj === 'object' && nestedObj !== null) {
      return getPropertyFromPath(nestedObj as Record<string, unknown>, pathArr.slice(1).join('.'));
    }
    return undefined;
  } else {
    const objValue = obj as Record<string, unknown>;
    return objValue[pathArr[0]];
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
