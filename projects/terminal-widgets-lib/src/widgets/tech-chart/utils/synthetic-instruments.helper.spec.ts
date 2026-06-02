import {SyntheticInstrumentsHelper} from './synthetic-instruments.helper';

describe('SyntheticInstrumentsHelper', () => {
  describe('getSymbolAndExchangeFromTicker', () => {
    it('should parse exchange and symbol from a colon-separated ticker', () => {
      expect(SyntheticInstrumentsHelper.getSymbolAndExchangeFromTicker('MOEX:SBER')).toEqual({
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: undefined
      });
    });

    it('should also parse the instrument group when present', () => {
      expect(SyntheticInstrumentsHelper.getSymbolAndExchangeFromTicker('MOEX:SBER:TQBR')).toEqual({
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR'
      });
    });

    it('should leave the exchange empty when there is no separator', () => {
      expect(SyntheticInstrumentsHelper.getSymbolAndExchangeFromTicker('SBER')).toEqual({
        symbol: 'SBER',
        exchange: ''
      });
    });
  });

  describe('getRegularOrSyntheticInstrumentKey', () => {
    it('should return an empty regular instrument for an empty string', () => {
      expect(SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey('')).toEqual({
        isSynthetic: false,
        instrument: {symbol: '', exchange: ''}
      });
    });

    it('should treat a single ticker without exchange as regular and default the exchange to MOEX', () => {
      const result = SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey('SBER');

      expect(result.isSynthetic).toBe(false);
      expect(result).toMatchObject({
        isSynthetic: false,
        instrument: {symbol: 'SBER', exchange: 'MOEX'}
      });
    });

    it('should treat a bracketed multi-part expression as synthetic', () => {
      const result = SyntheticInstrumentsHelper.getRegularOrSyntheticInstrumentKey('[MOEX:SBER]-[MOEX:GAZP]');

      expect(result.isSynthetic).toBe(true);
    });
  });

  describe('isSyntheticInstrument', () => {
    it('should return false when there are no brackets', () => {
      expect(SyntheticInstrumentsHelper.isSyntheticInstrument('SBER')).toBe(false);
    });

    it('should return true for a valid bracketed synthetic expression', () => {
      expect(SyntheticInstrumentsHelper.isSyntheticInstrument('[MOEX:SBER]-[MOEX:GAZP]')).toBe(true);
    });
  });

  describe('isSyntheticInstrumentValid', () => {
    it('should return true for a single regular instrument', () => {
      expect(SyntheticInstrumentsHelper.isSyntheticInstrumentValid('SBER')).toBe(true);
    });

    it('should return true for a valid synthetic expression', () => {
      expect(SyntheticInstrumentsHelper.isSyntheticInstrumentValid('[MOEX:SBER]-[MOEX:GAZP]')).toBe(true);
    });

    it('should return false for an empty string', () => {
      expect(SyntheticInstrumentsHelper.isSyntheticInstrumentValid('')).toBe(false);
    });
  });
});
