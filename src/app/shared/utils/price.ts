import { MathHelper } from "./math-helper";
/**
 * Really, just substracing times and rounding
 * @param lastPrice last price from quotes
 * @param closePrice last price of the previous trade day
 * @returns How much price changed for a day
 */
export function getDayChange(lastPrice: number, closePrice: number) {
  return MathHelper.round((lastPrice - closePrice), 2);
}

/**
 * A function to get a day change of price in percents
 * @param lastPrice last price from quotes
 * @param closePrice last price of the previous trade day
 * @returns How much price changed for a day in percent
 */
export function getDayChangePerPrice(lastPrice: number, closePrice: number) {
  return MathHelper.round((1 - (closePrice / lastPrice)) * 100, 2);
}
