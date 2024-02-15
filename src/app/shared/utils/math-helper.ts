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
  static round(num: number, decimals: number): number {
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
   * Rounding a value to minimal step precision and checks if
   * rounded value is a multiple of the minimal step
   * @param dirtyValue Number you need to round
   * @param minStep Instrument min step
   * @returns Rounded number
   */
  static roundByMinStepMultiplicity(dirtyValue: number, minStep: number): number {
    const roundedValue = this.round(
      dirtyValue,
      MathHelper.getPrecision(minStep)
    );
    const minStepPrecision = MathHelper.getPrecision(minStep);
    const valueMOD = this.round(roundedValue % minStep, minStepPrecision);

    if (!valueMOD) {
      return roundedValue;
    }

    if (valueMOD >= this.round(minStep / 2, minStepPrecision)) {
      return this.round(roundedValue + minStep - valueMOD, minStepPrecision);
    }

    return this.round(roundedValue - valueMOD, minStepPrecision);
  }

  /**
   * checks if valueToCheck is a multiple of multiplier
   * @param valueToCheck
   * @param multiplier
   */
  static isMultipleOf(valueToCheck: number, multiplier: number): boolean {
    const multiplierPrecision = Math.max(MathHelper.getPrecision(valueToCheck), MathHelper.getPrecision(multiplier));
    const base = Math.pow(10, multiplierPrecision);

    return Math.ceil(Math.round(valueToCheck * base) % Math.round(multiplier * base)) === 0;
  }
}
