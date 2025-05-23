import { MathHelper } from './math-helper';

describe('MathHelper', () => {
  describe('round', () => {
    it('should round a number to the specified number of decimals', () => {
      expect(MathHelper.round(1.2345, 2)).toBe(1.23);
      expect(MathHelper.round(1.2355, 2)).toBe(1.24);
      expect(MathHelper.round(1.2, 2)).toBe(1.2);
      expect(MathHelper.round(1, 0)).toBe(1);
      expect(MathHelper.round(1.999, 0)).toBe(2);
      expect(MathHelper.round(0.0000001, 5)).toBe(0);
    });

    it('should handle negative numbers', () => {
      expect(MathHelper.round(-1.2345, 2)).toBe(-1.23);
      expect(MathHelper.round(-1.2355, 2)).toBe(-1.24);
    });

    it('should handle zero decimals', () => {
      expect(MathHelper.round(123.456, 0)).toBe(123);
    });

    it('should handle rounding with Number.EPSILON for precision', () => {
      expect(MathHelper.round(0.1 + 0.2, 1)).toBe(0.3); // Addresses floating point inaccuracies
      expect(MathHelper.round(2.005, 2)).toBe(2.01);
    });
  });

  describe('getPrecision', () => {
    it('should return the number of decimal places', () => {
      expect(MathHelper.getPrecision(1.2345)).toBe(4);
      expect(MathHelper.getPrecision(123)).toBe(0);
      expect(MathHelper.getPrecision(0.1)).toBe(1);
      expect(MathHelper.getPrecision(0.00001)).toBe(5);
      expect(MathHelper.getPrecision(1.0)).toBe(0);
    });

    it('should return 0 for non-finite numbers', () => {
      expect(MathHelper.getPrecision(Infinity)).toBe(0);
      expect(MathHelper.getPrecision(-Infinity)).toBe(0);
      expect(MathHelper.getPrecision(NaN)).toBe(0);
    });

    it('should handle numbers that are already integers', () => {
      expect(MathHelper.getPrecision(100)).toBe(0);
    });
  });

  describe('roundPrice', () => {
    it('should round a price based on the minStep precision', () => {
      expect(MathHelper.roundPrice(123.4567, 0.01)).toBe(123.46);
      expect(MathHelper.roundPrice(123.4512, 0.01)).toBe(123.45);
      expect(MathHelper.roundPrice(10.5, 0.1)).toBe(10.5);
      expect(MathHelper.roundPrice(10.55, 0.1)).toBe(10.6);
      expect(MathHelper.roundPrice(10, 1)).toBe(10);
      expect(MathHelper.roundPrice(10.00005, 0.0001)).toBe(10.0001);
    });

    it('should handle minStep with no decimals', () => {
      expect(MathHelper.roundPrice(123.456, 1)).toBe(123);
      expect(MathHelper.roundPrice(123.789, 1)).toBe(124);
    });
  });

  describe('roundByMinStepMultiplicity', () => {
    it('should round a value to the nearest multiple of minStep', () => {
      expect(MathHelper.roundByMinStepMultiplicity(10.3, 0.5)).toBe(10.5);
      expect(MathHelper.roundByMinStepMultiplicity(10.2, 0.5)).toBe(10.0);
      expect(MathHelper.roundByMinStepMultiplicity(10.25, 0.5)).toBe(10.5); // Rounds up on .25 for 0.5 step
      expect(MathHelper.roundByMinStepMultiplicity(10.7, 0.5)).toBe(10.5);
      expect(MathHelper.roundByMinStepMultiplicity(10.8, 0.5)).toBe(11.0);
      expect(MathHelper.roundByMinStepMultiplicity(10.0, 0.25)).toBe(10.0);
      expect(MathHelper.roundByMinStepMultiplicity(10.1, 0.25)).toBe(10.0);
      expect(MathHelper.roundByMinStepMultiplicity(10.12, 0.25)).toBe(10.00);
      expect(MathHelper.roundByMinStepMultiplicity(10.125, 0.25)).toBe(10.25); // Rounds up on .125 for 0.25 step
      expect(MathHelper.roundByMinStepMultiplicity(10.2, 0.25)).toBe(10.25);
      // eslint-disable-next-line @typescript-eslint/no-loss-of-precision
      expect(MathHelper.roundByMinStepMultiplicity(1.0000000000000001, 0.00000001)).toBe(1.00000000);
      expect(MathHelper.roundByMinStepMultiplicity(1.000000004, 0.00000001)).toBe(1.00000000);
      expect(MathHelper.roundByMinStepMultiplicity(1.000000005, 0.00000001)).toBe(1.00000001);
      expect(MathHelper.roundByMinStepMultiplicity(1.000000006, 0.00000001)).toBe(1.00000001);
    });

    it('should return the same value if it is already a multiple of minStep', () => {
      expect(MathHelper.roundByMinStepMultiplicity(10.5, 0.5)).toBe(10.5);
      expect(MathHelper.roundByMinStepMultiplicity(10.0, 0.25)).toBe(10.0);
    });

    it('should handle minStep of 1', () => {
      expect(MathHelper.roundByMinStepMultiplicity(10.3, 1)).toBe(10);
      expect(MathHelper.roundByMinStepMultiplicity(10.7, 1)).toBe(11);
      expect(MathHelper.roundByMinStepMultiplicity(10.5, 1)).toBe(11);
    });

    it('should handle cases where dirtyValue is less than minStep/2', () => {
      expect(MathHelper.roundByMinStepMultiplicity(0.1, 0.5)).toBe(0.0);
      expect(MathHelper.roundByMinStepMultiplicity(0.04, 0.1)).toBe(0.0);
    });

    it('should handle cases where dirtyValue is greater than or equal to minStep/2', () => {
      expect(MathHelper.roundByMinStepMultiplicity(0.3, 0.5)).toBe(0.5);
      expect(MathHelper.roundByMinStepMultiplicity(0.06, 0.1)).toBe(0.1);
    });
  });

  describe('isMultipleOf', () => {
    it('should return true if valueToCheck is a multiple of multiplier', () => {
      expect(MathHelper.isMultipleOf(10, 2)).toBe(true);
      expect(MathHelper.isMultipleOf(10.5, 0.5)).toBe(true);
      expect(MathHelper.isMultipleOf(0.0006, 0.0002)).toBe(true);
      expect(MathHelper.isMultipleOf(1, 0.1)).toBe(true);
      expect(MathHelper.isMultipleOf(0.99999999, 0.33333333)).toBe(true);
    });

    it('should return false if valueToCheck is not a multiple of multiplier', () => {
      expect(MathHelper.isMultipleOf(10, 3)).toBe(false);
      expect(MathHelper.isMultipleOf(10.6, 0.5)).toBe(false);
      expect(MathHelper.isMultipleOf(0.0007, 0.0002)).toBe(false);
      expect(MathHelper.isMultipleOf(1.01, 0.1)).toBe(false);
    });

    it('should handle zero values', () => {
      expect(MathHelper.isMultipleOf(0, 5)).toBe(true); // 0 is a multiple of any non-zero number
      expect(MathHelper.isMultipleOf(5, 0)).toBe(false); // Cannot be a multiple of 0 (division by zero)
      expect(MathHelper.isMultipleOf(0, 0)).toBe(false); // Or true, depending on definition. Current impl is false.
    });

    it('should handle floating point precision issues', () => {
      expect(MathHelper.isMultipleOf(0.3, 0.1)).toBe(true);
      expect(MathHelper.isMultipleOf(0.6, 0.2)).toBe(true);
      expect(MathHelper.isMultipleOf(6, 0.2)).toBe(true);
      expect(MathHelper.isMultipleOf(0.00000003, 0.00000001)).toBe(true);
    });

    it('should handle negative numbers', () => {
      expect(MathHelper.isMultipleOf(-10, 2)).toBe(true);
      expect(MathHelper.isMultipleOf(10, -2)).toBe(true);
      expect(MathHelper.isMultipleOf(-10, -2)).toBe(true);
      expect(MathHelper.isMultipleOf(-10, 3)).toBe(false);
    });
  });
});
