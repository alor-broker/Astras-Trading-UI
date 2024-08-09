import { MathHelper } from "../../../shared/utils/math-helper";
import { Range } from "../../../shared/models/common.model";

export class OrderBookScaleHelper {
  static getStartPrice(bestAsk: number, bestBid: number, priceStep: number, scaleFactor: number, majorLinesStep: number): { startPrice: number, step: number }
  {
    const pricePrecision = MathHelper.getPrecision(priceStep);

    if (scaleFactor === 1) {
      const priceRowsCount = Math.ceil((bestAsk - bestBid) / priceStep);
      const startPrice = MathHelper.round(
        bestBid + Math.ceil(priceRowsCount / 2) * priceStep,
        pricePrecision
      );

      return {
        startPrice,
        step: priceStep
      };
    }

    const newPriceStep = MathHelper.round(priceStep * scaleFactor, pricePrecision);

    let startPrice = bestAsk;
    const multiplier = Math.pow(10, pricePrecision);
    const roundedPriceStep = Math.round(newPriceStep * multiplier * majorLinesStep);

    while (true) {
      const roundedPrice = Math.round(startPrice * multiplier);
      if (Math.round(roundedPrice % roundedPriceStep) > 0) {
        startPrice = MathHelper.round(startPrice - priceStep, pricePrecision);
        continue;
      }

      return {
        startPrice,
        step: newPriceStep
      };
    }
  }

  static scaledPriceToOriginal(scaledPrice: number, originalPriceStep: number, scaleFactor: number): Range {
    if(scaleFactor === 1) {
      return {
        min: scaledPrice,
        max: scaledPrice
      };
    }

    const pricePrecision = MathHelper.getPrecision(originalPriceStep);
    const isOddScale = scaleFactor % 2 === 0;
    const move = Math.floor(scaleFactor / 2);
    const upMove = isOddScale ? move - 1 : move;

    return {
      max: MathHelper.round(scaledPrice + upMove * originalPriceStep, pricePrecision),
      min: MathHelper.round(scaledPrice - move * originalPriceStep, pricePrecision)
    };
  }
}
