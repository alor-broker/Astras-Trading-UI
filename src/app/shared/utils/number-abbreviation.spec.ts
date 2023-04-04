import { getNumberAbbreviation, NumberAbbreviation } from "./number-abbreviation";

describe('Number Abbreviation', () => {
  it('should correctly format number', () => {
    const cases: { input: { value?: number | null, allowRounding: boolean, roundPrecision?: number }, expectedValue: NumberAbbreviation | null }[] = [
      { input: { value: undefined, allowRounding: false }, expectedValue: null },
      { input: { value: null, allowRounding: false }, expectedValue: null },
      { input: { value: 0, allowRounding: false }, expectedValue: { value: 0, suffixName: null } },
      { input: { value: 0, allowRounding: true }, expectedValue: { value: 0, suffixName: null } },
      { input: { value: 0.1, allowRounding: false }, expectedValue: { value: 0.1, suffixName: null } },
      { input: { value: 1, allowRounding: false }, expectedValue: { value: 1, suffixName: null } },
      { input: { value: 15, allowRounding: false }, expectedValue: { value: 15, suffixName: null } },
      { input: { value: 100, allowRounding: false }, expectedValue: { value: 100, suffixName: null } },
      { input: { value: 101, allowRounding: false }, expectedValue: { value: 101, suffixName: null } },
      { input: { value: 1000, allowRounding: false }, expectedValue: { value: 1, suffixName: 'thousands' } },
      { input: { value: 1010, allowRounding: false }, expectedValue: { value: 1010, suffixName: null } },
      { input: { value: 1010, allowRounding: true }, expectedValue: { value: 1.01, suffixName: 'thousands' } },
      { input: { value: 10_000, allowRounding: false }, expectedValue: { value: 10, suffixName: 'thousands' } },
      { input: { value: 10_050, allowRounding: false }, expectedValue: { value: 10_050, suffixName: null } },
      { input: { value: 10_050, allowRounding: true }, expectedValue: { value: 10.05, suffixName: 'thousands' } },
      { input: { value: 10_005, allowRounding: true, roundPrecision: 3 }, expectedValue: { value: 10.005, suffixName: 'thousands' } },
      { input: { value: 3_000_000, allowRounding: false }, expectedValue: { value: 3, suffixName: 'millions' } },
      { input: { value: 2_000_000_000, allowRounding: false }, expectedValue: { value: 2, suffixName: 'billions' } },
      { input: { value: 4_050_000_000, allowRounding: false }, expectedValue: { value: 4_050, suffixName: 'millions' } },
      { input: { value: 4_050_000_000, allowRounding: true }, expectedValue: { value: 4.05, suffixName: 'billions' } },
    ];

    cases.forEach(testCase => {
      expect(getNumberAbbreviation(testCase.input.value, testCase.input.allowRounding, testCase.input.roundPrecision))
        .toEqual(testCase.expectedValue);
    });
  });
});
