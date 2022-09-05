import { ShortNumberPipe } from './short-number.pipe';

describe('ShortNumberPipe', () => {
  it('create an instance', () => {
    const pipe = new ShortNumberPipe();
    expect(pipe).toBeTruthy();
  });

  it('should correctly format number', () => {
    const pipe = new ShortNumberPipe();

    const cases: { input?: number | null, expectedValue: string }[] = [
      { input: undefined, expectedValue: '' },
      { input: null, expectedValue: '' },
      { input: 1, expectedValue: '1' },
      { input: 0.1, expectedValue: '0.1' },
      { input: 15, expectedValue: '15' },
      { input: 100, expectedValue: '100' },
      { input: 101, expectedValue: '101' },
      { input: 1000, expectedValue: '1K' },
      { input: 1001, expectedValue: '1001' },
      { input: 10000, expectedValue: '10K' },
      { input: 10005, expectedValue: '10005' },
      { input: 3000000, expectedValue: '3M' },
      { input: 2000000000, expectedValue: '2B' },
    ];

    cases.forEach(testCase => {
      expect(pipe.transform(testCase.input)).toBe(testCase.expectedValue);
    });
  });
});
