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
}
