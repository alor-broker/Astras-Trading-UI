import {
  FuturesGluingType,
  FuturesInstrumentHelper
} from './futures-instrument.helper';

describe('FuturesInstrumentHelper', () => {
  describe('isFuturesGluing', () => {
    it('should return true for symbols ending with a gluing suffix', () => {
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!L')).toBe(true);
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!S')).toBe(true);
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!AL')).toBe(true);
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!AS')).toBe(true);
    });

    it('should be case insensitive', () => {
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!l')).toBe(true);
    });

    it('should return false for a plain symbol', () => {
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER')).toBe(false);
    });

    it('should return false for an unknown suffix', () => {
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!X')).toBe(false);
    });

    it('should match only at the end of the symbol', () => {
      expect(FuturesInstrumentHelper.isFuturesGluing('SBER!L-extra')).toBe(false);
    });
  });

  describe('getGluingType', () => {
    it('should return the matching gluing type', () => {
      expect(FuturesInstrumentHelper.getGluingType('SBER!L')).toBe(FuturesGluingType.L);
      expect(FuturesInstrumentHelper.getGluingType('SBER!AS')).toBe(FuturesGluingType.AS);
    });

    it('should normalize the suffix case', () => {
      expect(FuturesInstrumentHelper.getGluingType('SBER!al')).toBe(FuturesGluingType.AL);
    });

    it('should return null when there is no gluing suffix', () => {
      expect(FuturesInstrumentHelper.getGluingType('SBER')).toBeNull();
    });
  });
});
