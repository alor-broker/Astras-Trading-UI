import { MathHelper } from "./math-helper";

export function getDayChange(lastPrice: number, closePrice: number) {
  return MathHelper.round((lastPrice - closePrice), 2);
}
export function getDayChangePerPrice(lastPrice: number, closePrice: number) {
  return MathHelper.round((1 - (closePrice / lastPrice)) * 100, 2);
}
