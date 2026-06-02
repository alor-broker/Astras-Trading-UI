import {ValueHelper} from './value.helper';

describe('ValueHelper', () => {
  describe('getValueOrDefault', () => {
    it('should return the source value when it is not null', () => {
      expect(ValueHelper.getValueOrDefault('value', 'fallback')).toBe('value');
    });

    it('should return the default when the value is null', () => {
      expect(ValueHelper.getValueOrDefault<string>(null, 'fallback')).toBe('fallback');
    });

    it('should treat falsy non-null values as valid and not substitute the default', () => {
      expect(ValueHelper.getValueOrDefault(0, 42)).toBe(0);
      expect(ValueHelper.getValueOrDefault('', 'fallback')).toBe('');
    });
  });
});
