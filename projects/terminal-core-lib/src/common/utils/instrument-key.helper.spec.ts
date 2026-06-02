import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from './instrument-key.helper';
import {InstrumentFixtures} from '@testing-lib/fixtures/instrument';

describe('instrument-key.helper', () => {
  describe('InstrumentEqualityComparer', () => {
    const base = InstrumentFixtures.createInstrumentKey({isin: 'RU0009029540', instrumentGroup: 'TQBR'});

    it('should return true for instruments with the same identifying fields', () => {
      expect(InstrumentEqualityComparer.equals(base, {...base})).toBe(true);
    });

    it('should return false when the symbol differs', () => {
      expect(InstrumentEqualityComparer.equals(base, {...base, symbol: 'GAZP'})).toBe(false);
    });

    it('should return false when the exchange differs', () => {
      expect(InstrumentEqualityComparer.equals(base, {...base, exchange: 'SPBX'})).toBe(false);
    });

    it('should treat null and undefined optional fields as equal', () => {
      const a = {symbol: 'SBER', exchange: 'MOEX', isin: undefined, instrumentGroup: null};
      const b = {symbol: 'SBER', exchange: 'MOEX'};

      expect(InstrumentEqualityComparer.equals(a, b)).toBe(true);
    });

    it('should treat two nulls as equal and null vs instrument as not equal', () => {
      expect(InstrumentEqualityComparer.equals(null, null)).toBe(true);
      expect(InstrumentEqualityComparer.equals(null, base)).toBe(false);
    });
  });

  describe('InstrumentKeyHelper', () => {
    describe('toInstrumentKey', () => {
      it('should strip extra fields and keep only the instrument key shape', () => {
        const shape = {
          symbol: 'SBER',
          exchange: 'MOEX',
          isin: 'RU0009029540',
          instrumentGroup: 'TQBR',
          description: 'extra field that must be dropped'
        };

        expect(InstrumentKeyHelper.toInstrumentKey(shape)).toEqual({
          symbol: 'SBER',
          exchange: 'MOEX',
          isin: 'RU0009029540',
          instrumentGroup: 'TQBR'
        });
      });

      it('should pass through undefined optional fields', () => {
        expect(InstrumentKeyHelper.toInstrumentKey({symbol: 'SBER', exchange: 'MOEX'})).toEqual({
          symbol: 'SBER',
          exchange: 'MOEX',
          isin: undefined,
          instrumentGroup: undefined
        });
      });
    });
  });
});
