import { OrderBookScaleHelper } from "./order-book-scale.helper";
import { MathHelper } from "../../../shared/utils/math-helper";
import { Range } from "../../../shared/models/common.model";

describe('OrderBookScaleHelper', () => {
  describe('getStartPrice', () => {
    it('should correctly calculate start price', () => {
      const testCases: {
        bestAsk: number;
        priceStep: number;
        spreadLength: number;
        scaleFactor: number;
        expectedValue: number;
      }[] = [
        // scale factor 1
        {
          bestAsk: 2.0,
          priceStep: 0.1,
          spreadLength: 1,
          scaleFactor: 1,
          expectedValue: 1.9
        },
        {
          bestAsk: 2.0,
          priceStep: 0.1,
          spreadLength: 2,
          scaleFactor: 1,
          expectedValue: 1.9
        },
        {
          bestAsk: 2.0,
          priceStep: 0.1,
          spreadLength: 3,
          scaleFactor: 1,
          expectedValue: 1.8
        },
        {
          bestAsk: 2.0,
          priceStep: 0.1,
          spreadLength: 0,
          scaleFactor: 1,
          expectedValue: 2.0
        },
        // scale factor 2
        {
          bestAsk: 2.0,
          priceStep: 0.1,
          spreadLength: 1,
          scaleFactor: 2,
          expectedValue: 2.0
        },
        {
          bestAsk: 1.9,
          priceStep: 0.1,
          spreadLength: 2,
          scaleFactor: 2,
          expectedValue: 1.8
        },
        {
          bestAsk: 2.1,
          priceStep: 0.1,
          spreadLength: 0,
          scaleFactor: 2,
          expectedValue: 2.0
        },
        // scale factor 3
        {
          bestAsk: 2.1,
          priceStep: 0.1,
          spreadLength: 1,
          scaleFactor: 3,
          expectedValue: 2.1
        },
        {
          bestAsk: 2.0,
          priceStep: 0.1,
          spreadLength: 2,
          scaleFactor: 3,
          expectedValue: 1.8
        },
        {
          bestAsk: 2.2,
          priceStep: 0.1,
          spreadLength: 0,
          scaleFactor: 3,
          expectedValue: 2.1
        },
        {
          bestAsk: 1.3378,
          priceStep: 0.0001,
          spreadLength: 0,
          scaleFactor: 3,
          expectedValue: 1.3378
        }
      ];

      testCases.forEach(testCase => {
        const bestBid = testCase.bestAsk - testCase.priceStep * (testCase.spreadLength + 1);

        const value = OrderBookScaleHelper.getStartPrice(testCase.bestAsk, bestBid, testCase.priceStep, testCase.scaleFactor);

        expect(value.step)
          .withContext(JSON.stringify(testCase))
          .toBe(MathHelper.round(testCase.priceStep * testCase.scaleFactor, MathHelper.getPrecision(testCase.priceStep)));

        expect(value.startPrice)
          .withContext(JSON.stringify(testCase))
          .toBe(testCase.expectedValue);
      });
    });
  });

  describe('scaledPriceToOriginal', () => {
    it('should correctly calculate original price range', () => {
      const testCases: {
        scaledPrice: number;
        scaleFactor: number;
        originalPriceStep: number;
        expectedRange: Range;
      }[] = [
        {
          scaledPrice: 2.1,
          scaleFactor: 1,
          originalPriceStep: 0.1,
          expectedRange: { min: 2.1, max: 2.1 }
        },
        {
          scaledPrice: 2.2,
          scaleFactor: 2,
          originalPriceStep: 0.1,
          expectedRange: { min: 2.1, max: 2.2 }
        },
        {
          scaledPrice: 2.4,
          scaleFactor: 2,
          originalPriceStep: 0.1,
          expectedRange: { min: 2.3, max: 2.4 }
        },
        {
          scaledPrice: 2.4,
          scaleFactor: 3,
          originalPriceStep: 0.1,
          expectedRange: { min: 2.3, max: 2.5 }
        },
        {
          scaledPrice: 2.1,
          scaleFactor: 3,
          originalPriceStep: 0.1,
          expectedRange: { min: 2.0, max: 2.2 }
        },
        {
          scaledPrice: 1.8,
          scaleFactor: 3,
          originalPriceStep: 0.1,
          expectedRange: { min: 1.7, max: 1.9 }
        },
      ];

      testCases.forEach(testCase => {
        const range = OrderBookScaleHelper.scaledPriceToOriginal(testCase.scaledPrice, testCase.originalPriceStep, testCase.scaleFactor);

        expect(range)
          .withContext(JSON.stringify(testCase))
          .toEqual(testCase.expectedRange);
      });
    });
  });
});
