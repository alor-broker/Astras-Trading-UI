import { MathHelper } from "../../../shared/utils/math-helper";

interface ShortPriceFormat { minMove: number, precision: number }

export class PriceFormatHelper {
  /**
   * Returns price format for light-charts
   *
   * @param {number} minstep Minimum value the price can change. It can be like 0.01 or 0.0005. 0.07 is not the case thanks god.
   * @return {ShortPriceFormat} Price format, to be assigned to lightcharts.
   */
  public static getPriceFormat(minstep: number): ShortPriceFormat {
    if (minstep >= 1) {
      return {
        minMove: 1,
        precision: 0
      };
    }

    const precision = MathHelper.getPrecision(minstep);
    return {
      precision: precision,
      minMove: Number((10 ** -precision).toFixed(precision))
    } as ShortPriceFormat;
  }
}
