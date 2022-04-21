export class MathHelper {
  static round(num: number, decimals: number) {
    const multiplier = Math.pow(10, decimals);
    return Math.round((num + Number.EPSILON) * multiplier) / multiplier;
  }
}
