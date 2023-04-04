/**
 * Class with math related functions
 */
export class MathHelper {
  /**
   * Rounding a number to provided decimals
   * @param num Number you need to round
   * @param decimals Number of decimals
   * @returns Rounded number
   */
  static round(num: number, decimals: number) {
    const multiplier = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * multiplier) / multiplier;
  }

  /**
   * Returns the number of decimal places
   * @param a Target number
   * @returns The number of decimal places
   */
  static getPrecision(a: number): number {
    if (!isFinite(a)) return 0;
    let e = 1;
    let p = 0;

    while (Math.round(a * e) / e !== a) {
      e *= 10;
      p++;
    }

    return p;
  }
}
