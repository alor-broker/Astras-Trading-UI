import { InstrumentKey } from "../models/instruments/instrument-key.model";
import { InstrumentEqualityComparer } from "./instruments";

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
});
