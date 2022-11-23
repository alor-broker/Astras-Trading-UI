import {
  CsvFormatter,
  CsvFormatterConfig,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from "./csv-formatter";

interface TestData {
  a: string,
  b: string
}

interface TestCase {
  meta: ExportColumnMeta<TestData>[],
  data: TestData[],
  config: CsvFormatterConfig,
  expectedResult: (meta: ExportColumnMeta<TestData>[], data: TestData[], config: CsvFormatterConfig) => string
}

describe('CsvFormatter', () => {
  it('#toCsv', () => {

    const cases: TestCase[] = [
      {
        meta: [
          { title: 'A', readFn: item => item.a }, { title: 'B', readFn: item => item.b },
        ],
        data: [{ a: 'a', b: 'b' }],
        config: {
          ...csvFormatterConfigDefaults,
          addBOM: false
        },
        expectedResult: (meta: ExportColumnMeta<TestData>[], data: TestData[], config: CsvFormatterConfig) => {
          const expectedHeader = `${meta[0].title}${config.fieldSeparator}${meta[1].title}`;
          const expectedBody = `${data[0].a}${config.fieldSeparator}${data[0].b}`;

          return `${expectedHeader}${config.endOfLine}${expectedBody}`;
        }
      },
      {
        meta: [
          { title: 'A', readFn: item => item.a }, { title: 'B', readFn: item => item.b },
        ],
        data: [{ a: 'a', b: 'b;c' }],
        config: {
          ...csvFormatterConfigDefaults,
          addBOM: false
        },
        expectedResult: (meta: ExportColumnMeta<TestData>[], data: TestData[], config: CsvFormatterConfig) => {
          const expectedHeader = `${meta[0].title}${config.fieldSeparator}${meta[1].title}`;
          const expectedBody = `${data[0].a}${config.fieldSeparator}"${data[0].b}"`;

          return `${expectedHeader}${config.endOfLine}${expectedBody}`;
        }
      },
      {
        meta: [
          { title: 'A', readFn: item => item.a }, { title: 'B', readFn: item => item.b },
        ],
        data: [{ a: 'a', b: 'b"' }],
        config: {
          ...csvFormatterConfigDefaults,
          addBOM: false
        },
        expectedResult: (meta: ExportColumnMeta<TestData>[], data: TestData[], config: CsvFormatterConfig) => {
          const expectedHeader = `${meta[0].title}${config.fieldSeparator}${meta[1].title}`;
          const expectedBody = `${data[0].a}${config.fieldSeparator}"${data[0].b}""`;

          return `${expectedHeader}${config.endOfLine}${expectedBody}`;
        }
      },
    ];

    cases.forEach((testCase, index) => {
      const result = CsvFormatter.toCsv(testCase.meta, testCase.data, testCase.config);
      const expectedResult = testCase.expectedResult(testCase.meta, testCase.data, testCase.config);

      expect(result)
        .withContext(`Case #${index}`)
        .toEqual(expectedResult);
    });
  });
});
