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

  /**
   * Rounding a price
   * @param dirtyPrice Number you need to round
   * @param minStep Instrument min step
   * @returns Rounded number
   */
  static roundPrice(dirtyPrice: number, minStep: number): number {
    return this.round(
      dirtyPrice,
      MathHelper.getPrecision(minStep)
    );
  }

  /**
   * Rounding a price to min step precision and checks if
   * rounded price is a multiple of the price step
   * @param dirtyPrice Number you need to round
   * @param minStep Instrument min step
   * @returns Rounded number
   */
  static roundPriceByMinStep(dirtyPrice: number, minStep: number) {
    const roundedPrice = this.round(
      dirtyPrice,
      MathHelper.getPrecision(minStep)
    );
    const minStepPrecision = MathHelper.getPrecision(minStep);
    const priceMOD = this.round(roundedPrice % minStep, minStepPrecision);

    if (!priceMOD) {
      return roundedPrice;
    }

    if (priceMOD >= this.round(minStep / 2, minStepPrecision)) {
      return this.round(roundedPrice + minStep - priceMOD, minStepPrecision);
    }

    return this.round(roundedPrice - priceMOD, minStepPrecision);
  }
}
