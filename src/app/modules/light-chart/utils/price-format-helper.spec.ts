import { PriceFormatHelper } from './price-format-helper';

describe('PriceFormatHelper', () => {
  it('getPriceFormat', () => {
    const caseCheck = (minStep: number, expectedMinMove: number, expectedPrecision: number) => {
      const value = PriceFormatHelper.getPriceFormat(minStep);

      expect(value.minMove)
        .withContext(`MinMove for ${minStep}`)
        .toEqual(expectedMinMove);

      expect(value.precision)
        .withContext(`Precision for ${minStep}`)
        .toEqual(expectedPrecision);
    };

    // RTS-6.22
    caseCheck(10, 1, 0);
    // AKRN
    caseCheck(2, 1, 0);
    // SBER
    caseCheck(0.01, 0.01, 2);
    // AFLT
    caseCheck(0.02, 0.01, 2);
    // USD000UTSTOM
    caseCheck(0.0025, 0.0001, 4);
    // VTBR
    caseCheck(0.000005, 0.000001, 6);
  });
});
