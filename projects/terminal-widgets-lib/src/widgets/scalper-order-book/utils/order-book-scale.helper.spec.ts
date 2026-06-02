import {OrderBookScaleHelper} from './order-book-scale.helper';

describe('OrderBookScaleHelper', () => {
  describe('getStartPrice', () => {
    it('should center the start price between bid and ask when not scaled', () => {
      const result = OrderBookScaleHelper.getStartPrice(105, 100, 1, 1, 10);

      expect(result).toEqual({startPrice: 103, step: 1});
    });

    it('should align the start price to the scaled grid when scaled', () => {
      const result = OrderBookScaleHelper.getStartPrice(105, 100, 1, 2, 10);

      expect(result).toEqual({startPrice: 100, step: 2});
    });
  });

  describe('scaledPriceToOriginal', () => {
    it('should map a scaled price to a single price when not scaled', () => {
      expect(OrderBookScaleHelper.scaledPriceToOriginal(100, 0.01, 1)).toEqual({min: 100, max: 100});
    });

    it('should expand an even scale below the scaled price', () => {
      expect(OrderBookScaleHelper.scaledPriceToOriginal(100, 0.01, 2)).toEqual({min: 99.99, max: 100});
    });

    it('should expand an odd scale symmetrically around the scaled price', () => {
      expect(OrderBookScaleHelper.scaledPriceToOriginal(100, 0.01, 3)).toEqual({min: 99.99, max: 100.01});
    });
  });
});
