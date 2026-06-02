import {StringHelper} from './string.helper';

describe('StringHelper', () => {
  describe('getSimpleHash', () => {
    it('should return a stable hash for the same input', () => {
      expect(StringHelper.getSimpleHash('order-book')).toBe(StringHelper.getSimpleHash('order-book'));
    });

    it('should return different hashes for different inputs', () => {
      expect(StringHelper.getSimpleHash('a')).not.toBe(StringHelper.getSimpleHash('b'));
    });

    it('should return "0" for an empty string', () => {
      expect(StringHelper.getSimpleHash('')).toBe('0');
    });

    it('should always return a non-negative numeric string', () => {
      // The implementation may produce negative 32-bit integers internally;
      // the contract is that the result is the absolute value as a string.
      expect(StringHelper.getSimpleHash('any-string-with-negative-hash')).toMatch(/^\d+$/);
    });
  });

  describe('getPascalCase', () => {
    it('should convert space-separated words to PascalCase', () => {
      expect(StringHelper.getPascalCase('order book widget')).toBe('OrderBookWidget');
    });

    it('should convert dash-separated words to PascalCase', () => {
      expect(StringHelper.getPascalCase('order-book-widget')).toBe('OrderBookWidget');
    });

    it('should lowercase the rest of each word', () => {
      expect(StringHelper.getPascalCase('ORDER bOOk')).toBe('OrderBook');
    });

    it('should return an empty string for an empty input', () => {
      expect(StringHelper.getPascalCase('')).toBe('');
    });
  });

  describe('isNullOrEmpty', () => {
    it('should return true for null', () => {
      expect(StringHelper.isNullOrEmpty(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(StringHelper.isNullOrEmpty(undefined)).toBe(true);
    });

    it('should return true for an empty string', () => {
      expect(StringHelper.isNullOrEmpty('')).toBe(true);
    });

    it('should return false for a non-empty string', () => {
      expect(StringHelper.isNullOrEmpty(' ')).toBe(false);
      expect(StringHelper.isNullOrEmpty('value')).toBe(false);
    });
  });
});
