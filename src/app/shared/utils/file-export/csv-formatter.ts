export class CsvFormatterConstants {
  public static EOL = "\r\n";
  public static DEFAULT_FIELD_SEPARATOR = ';';
  public static BOM_PREFIX = '\ufeff';
}

export interface CsvFormatterConfig {
  readonly fieldSeparator: string;
  readonly endOfLine: string;
  readonly addBOM: boolean;
}

export const csvFormatterConfigDefaults: CsvFormatterConfig = {
  fieldSeparator: CsvFormatterConstants.DEFAULT_FIELD_SEPARATOR,
  endOfLine: CsvFormatterConstants.EOL,
  addBOM: true
};

export interface ExportColumnMeta<T> {
  title: string;
  readFn: (item: T) => string;
}

export class CsvFormatter {
  static toCsv<T>(meta: ExportColumnMeta<T>[], data: T[], config: CsvFormatterConfig): string {
    const rows: string[] = [];

    rows.push(this.generateHeaderRow(meta, config));

    data.forEach(row => rows.push(this.generateItemRow(meta, row, config)));

    let res = '';
    if(config.addBOM) {
      res += CsvFormatterConstants.BOM_PREFIX;
    }

    res += rows.join(config.endOfLine);

    return res;
  }

  private static generateHeaderRow<T>(meta: ExportColumnMeta<T>[], config: CsvFormatterConfig): string {
    return meta.map(m => m.title).join(config.fieldSeparator);
  }

  private static generateItemRow<T>(meta: ExportColumnMeta<T>[], data: T, config: CsvFormatterConfig): string {
    return meta.map(m => this.sanitizeValue(m.readFn(data), config))
      .join(config.fieldSeparator);
  }

  private static sanitizeValue(value: string, config: CsvFormatterConfig): string {
    if (!value) {
      return value;
    }

    let sanitizedValue = value.toString();

    let quoted = false;

    if (sanitizedValue.includes('"')) {
      sanitizedValue = `"${sanitizedValue.replace('"', '""')}"`;
      quoted = true;
    }

    if (!quoted && sanitizedValue.includes(config.fieldSeparator)) {
      sanitizedValue = `"${sanitizedValue}"`;
    }

    return sanitizedValue;
  }
}
