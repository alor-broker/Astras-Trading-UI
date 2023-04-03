export interface FormatToBase {
  value: number;
  suffixName: string | null
}

const numberBases = [
  {
    base: 10 ** 12,
    name: 'trillions'
  },
  {
    base: 10 ** 9,
    name: 'billions'
  },
  {
    base: 10 ** 6,
    name: 'millions'
  },
  {
    base: 10 ** 3,
    name: 'thousands'
  }
];

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

  static getBaseNumber(value: number | null | undefined, allowRounding = false, roundPrecision = 2) {
    if (!value && value !== 0) {
      return null;
    }

    for (let base of numberBases) {
      const displayData = MathHelper.tryFormatToBase(
        value,
        base.base,
        base.name,
        allowRounding,
        roundPrecision
      );

      if (displayData != null) {
        return displayData;
      }
    }

    return {
      value: value,
      suffixName: null
    };
  }

  private static tryFormatToBase(value: number, base: number, baseName: string, allowRounding: boolean, roundPrecision: number): FormatToBase | null {
    if (allowRounding) {
      if (value! >= base) {
        const formattedValue = MathHelper.round(value! / base, roundPrecision);
        return {
          value: formattedValue,
          suffixName: baseName
        };
      }

      return null;
    }
    else {
      if (value! % base === 0) {
        return{
          value: value! / base,
          suffixName: baseName
        };
      }

      return null;
    }
  }
}
