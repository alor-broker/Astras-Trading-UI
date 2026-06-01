import {MathHelper} from './math.helper';

describe('MathHelper', () => {
  describe('round', () => {
    it('should round a number to the provided number of decimals', () => {
      expect(MathHelper.round(1.23456, 2)).toBe(1.23);
      expect(MathHelper.round(1.005, 2)).toBe(1.01);
    });
  });

  describe('getPrecision', () => {
    it('should return the number of decimal places', () => {
      expect(MathHelper.getPrecision(0.001)).toBe(3);
      expect(MathHelper.getPrecision(10)).toBe(0);
    });
  });

  describe('roundPrice', () => {
    it('should round a price to the precision of the min step', () => {
      expect(MathHelper.roundPrice(100.123, 0.01)).toBe(100.12);
      expect(MathHelper.roundPrice(100.126, 0.01)).toBe(100.13);
    });
  });

  describe('isMultipleOf', () => {
    it('should detect whether a value is a multiple of another', () => {
      expect(MathHelper.isMultipleOf(0.6, 0.2)).toBe(true);
      expect(MathHelper.isMultipleOf(0.65, 0.2)).toBe(false);
    });
  });
});
