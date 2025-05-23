import { InstrumentKey } from "../models/instruments/instrument-key.model";
import { FutureType, InstrumentType } from "../models/enums/instrument-type.model";
import { InstrumentEqualityComparer, getFutureType, getTypeByCfi, toInstrumentKey } from "./instruments";
import { Instrument } from "../models/instruments/instrument.model";

describe('Instrument Utils', () => {
  describe('InstrumentEqualityComparer', () => {
    it('#equals', () => {
      const cases: { a: InstrumentKey | null, b: InstrumentKey | null, expectedValue: boolean }[] = [
        {
          a: { symbol: 'SBER', exchange: 'MOEX' },
          b: { symbol: 'SBER', exchange: 'MOEX' },
          expectedValue: true
        },
        {
          a: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR' },
          b: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR' },
          expectedValue: true
        },
        {
          a: { symbol: 'SBER', exchange: 'MOEX', isin: 'RU0007661625' },
          b: { symbol: 'SBER', exchange: 'MOEX', isin: 'RU0007661625' },
          expectedValue: true
        },
        {
          a: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR', isin: 'RU0007661625' },
          b: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR', isin: 'RU0007661625' },
          expectedValue: true
        },
        {
          a: { symbol: 'SBER', exchange: 'MOEX' },
          b: { symbol: 'GAZP', exchange: 'MOEX' },
          expectedValue: false
        },
        {
          a: null,
          b: { symbol: 'A', exchange: 'MOEX' },
          expectedValue: false
        },
        {
          a: { symbol: 'A', exchange: 'SPBX' },
          b: { symbol: 'A', exchange: 'MOEX' },
          expectedValue: false
        },
        {
          a: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR' },
          b: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'SMAL' },
          expectedValue: false
        },
        {
          a: { symbol: 'SBER', exchange: 'MOEX', instrumentGroup: 'TQBR' },
          b: { symbol: 'SBER', exchange: 'MOEX' },
          expectedValue: false
        },
        {
          a: { symbol: 'A', exchange: 'MOEX', isin: 'RU0000000000' },
          b: { symbol: 'A', exchange: 'MOEX', isin: 'RU0000000001' },
          expectedValue: false
        },
        {
          a: { symbol: 'A', exchange: 'MOEX', isin: 'RU0000000000' },
          b: { symbol: 'A', exchange: 'MOEX' },
          expectedValue: false
        },
        {
          a: { symbol: 'A', exchange: 'MOEX', instrumentGroup: 'TQBR', isin: 'RU0000000000' },
          b: { symbol: 'A', exchange: 'MOEX', isin: 'RU0000000001' },
          expectedValue: false
        },
        {
          a: { symbol: 'A', exchange: 'MOEX', instrumentGroup: 'TQBR', isin: 'RU0000000000' },
          b: { symbol: 'A', exchange: 'MOEX', instrumentGroup: 'TQBR', isin: 'RU0000000001' },
          expectedValue: false
        }
      ];

      cases.forEach(testCase => {
        expect(InstrumentEqualityComparer.equals(testCase.a, testCase.b))
          .withContext(JSON.stringify(testCase))
          .toEqual(testCase.expectedValue);
      });
    });
  });

  describe('getTypeByCfi', () => {
    const testCases: { cfi: string | undefined, expected: InstrumentType }[] = [
      { cfi: 'DBXXXX', expected: InstrumentType.Bond },
      { cfi: 'EXXXXX', expected: InstrumentType.Stock },
      { cfi: 'MRCXXX', expected: InstrumentType.CurrencyInstrument },
      { cfi: 'FXXXXX', expected: InstrumentType.Futures },
      { cfi: 'OXXXXX', expected: InstrumentType.Options },
      { cfi: 'UNKNOWN', expected: InstrumentType.Other },
      { cfi: '', expected: InstrumentType.Other },
      { cfi: undefined, expected: InstrumentType.Other },
      { cfi: 'E', expected: InstrumentType.Stock },
      { cfi: 'DB', expected: InstrumentType.Bond },
      { cfi: 'MRC', expected: InstrumentType.CurrencyInstrument },
      { cfi: 'F', expected: InstrumentType.Futures },
      { cfi: 'O', expected: InstrumentType.Options },
    ];

    testCases.forEach(testCase => {
      it(`should return ${testCase.expected} for CFI ${testCase.cfi}`, () => {
        expect(getTypeByCfi(testCase.cfi)).toEqual(testCase.expected);
      });
    });
  });

  describe('getFutureType', () => {
    const testCases: { cfi: string, expected: FutureType | undefined }[] = [
      { cfi: 'FFXPSX', expected: FutureType.Deliverable },
      { cfi: 'FFXCSX', expected: FutureType.Settlement },
      { cfi: 'FFXNSX', expected: FutureType.NonDeliverable },
      { cfi: 'FFXASX', expected: undefined },
      { cfi: 'FFX', expected: undefined },
      { cfi: '', expected: undefined },
    ];

    testCases.forEach(testCase => {
      it(`should return ${testCase.expected} for CFI ${testCase.cfi}`, () => {
        expect(getFutureType(testCase.cfi)).toEqual(testCase.expected);
      });
    });
  });

  describe('toInstrumentKey', () => {
    it('should convert Instrument to InstrumentKey', () => {
      const instrument: Instrument = {
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU0007661625',
        description: 'Sberbank PJSC',
        shortName: 'Sberbank',
        currency: 'RUB',
        minstep: 0.01,
        lotsize: 10,
        cfiCode: 'ESXXXX',
        type: InstrumentType.Stock
      };

      const expectedKey: InstrumentKey = {
        symbol: 'SBER',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU0007661625'
      };

      expect(toInstrumentKey(instrument)).toEqual(expectedKey);
    });

    it('should convert InstrumentKey to InstrumentKey (identity)', () => {
      const instrumentKey: InstrumentKey = {
        symbol: 'GAZP',
        exchange: 'MOEX',
        instrumentGroup: 'TQBR',
        isin: 'RU0007661626'
      };

      expect(toInstrumentKey(instrumentKey)).toEqual(instrumentKey);
    });
  });
});
