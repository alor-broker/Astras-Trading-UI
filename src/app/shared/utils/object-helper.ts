/* возвращает свойство объекта по передаваемому пути
 * ```typescript
 *  const a = {b: { c: 1}};
 *  getProperty(a, 'b.c') // 1
 * ```
 *
 * @param obj передаваемый объект
 * @param path путь к свойству через '.'
 *
 * @returns значение свойства в объекте
*/
export function getPropertyFromPath(obj: any, path: string): any {
  const pathArr = path.split('.');

  if (pathArr.length > 1) return getPropertyFromPath(obj[pathArr[0]], pathArr.slice(1).join('.'));
  else return obj[pathArr[0]];
}
