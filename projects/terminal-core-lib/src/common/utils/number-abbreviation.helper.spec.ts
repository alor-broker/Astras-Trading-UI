import {NumberAbbreviationHelper} from './number-abbreviation.helper';

describe('NumberAbbreviationHelper', () => {
  describe('getNumberAbbreviation', () => {
    it('should return null for null or undefined input', () => {
      expect(NumberAbbreviationHelper.getNumberAbbreviation(null)).toBeNull();
      expect(NumberAbbreviationHelper.getNumberAbbreviation(undefined)).toBeNull();
    });

    it('should return zero with no suffix', () => {
      expect(NumberAbbreviationHelper.getNumberAbbreviation(0)).toEqual({value: 0, suffixName: null});
    });

    describe('without rounding', () => {
      it('should abbreviate exact multiples of a base', () => {
        expect(NumberAbbreviationHelper.getNumberAbbreviation(5000)).toEqual({value: 5, suffixName: 'thousands'});
        expect(NumberAbbreviationHelper.getNumberAbbreviation(3_000_000)).toEqual({value: 3, suffixName: 'millions'});
      });

      it('should pick the largest matching base', () => {
        expect(NumberAbbreviationHelper.getNumberAbbreviation(2_000_000_000)).toEqual({value: 2, suffixName: 'billions'});
      });

      it('should not abbreviate when the value is not an exact multiple', () => {
        expect(NumberAbbreviationHelper.getNumberAbbreviation(1500)).toEqual({value: 1500, suffixName: null});
      });
    });

    describe('with rounding', () => {
      it('should abbreviate and round any value above the base', () => {
        expect(NumberAbbreviationHelper.getNumberAbbreviation(1500, true)).toEqual({value: 1.5, suffixName: 'thousands'});
      });

      it('should respect the rounding precision', () => {
        expect(NumberAbbreviationHelper.getNumberAbbreviation(1_234_000, true, 1)).toEqual({value: 1.2, suffixName: 'millions'});
      });

      it('should leave values below one thousand without a suffix', () => {
        expect(NumberAbbreviationHelper.getNumberAbbreviation(999, true)).toEqual({value: 999, suffixName: null});
      });
    });
  });
});
