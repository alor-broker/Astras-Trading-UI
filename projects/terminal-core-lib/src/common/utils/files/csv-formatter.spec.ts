import {
  CsvFormatter,
  CsvFormatterConstants,
  csvFormatterConfigDefaults,
  ExportColumnMeta
} from './csv-formatter';

interface Row {
  name: string;
  price: string;
}

describe('CsvFormatter', () => {
  const meta: ExportColumnMeta<Row>[] = [
    {title: 'Name', readFn: r => r.name},
    {title: 'Price', readFn: r => r.price}
  ];

  describe('toCsv', () => {
    it('should render a header row followed by data rows joined by the configured EOL', () => {
      const result = CsvFormatter.toCsv(
        meta,
        [{name: 'SBER', price: '300'}],
        {...csvFormatterConfigDefaults, addBOM: false}
      );

      expect(result).toBe(`Name;Price${CsvFormatterConstants.EOL}SBER;300`);
    });

    it('should prepend the BOM prefix when addBOM is enabled', () => {
      const result = CsvFormatter.toCsv(meta, [], csvFormatterConfigDefaults);

      expect(result.startsWith(CsvFormatterConstants.BOM_PREFIX)).toBe(true);
    });

    it('should use the configured field separator', () => {
      const result = CsvFormatter.toCsv(
        meta,
        [{name: 'SBER', price: '300'}],
        {...csvFormatterConfigDefaults, fieldSeparator: ',', addBOM: false}
      );

      expect(result).toBe(`Name,Price${CsvFormatterConstants.EOL}SBER,300`);
    });

    it('should quote a value that contains the field separator', () => {
      const result = CsvFormatter.toCsv(
        meta,
        [{name: 'Acme; Inc', price: '1'}],
        {...csvFormatterConfigDefaults, addBOM: false}
      );

      expect(result).toContain('"Acme; Inc";1');
    });

    it('should quote and escape a value containing a double quote', () => {
      const result = CsvFormatter.toCsv(
        meta,
        [{name: 'a"b', price: '1'}],
        {...csvFormatterConfigDefaults, addBOM: false}
      );

      expect(result).toContain('"a""b";1');
    });

    it('should escape every double quote in a value containing multiple double quotes', () => {
      const result = CsvFormatter.toCsv(
        meta,
        [{name: 'a"b"c', price: '1'}],
        {...csvFormatterConfigDefaults, addBOM: false}
      );

      expect(result).toContain('"a""b""c";1');
    });
  });
});
