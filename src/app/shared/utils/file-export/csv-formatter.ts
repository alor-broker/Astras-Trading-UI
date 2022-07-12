export class CsvFormatterConstants {
  public static EOL = "\r\n";
  public static DEFAULT_FIELD_SEPARATOR = ',';
}

export interface CsvFormatterConfig {
  readonly fieldSeparator: string;
  readonly endOfLine: string;
}

export const csvFormatterConfigDefaults: CsvFormatterConfig = {
  fieldSeparator: CsvFormatterConstants.DEFAULT_FIELD_SEPARATOR,
  endOfLine: CsvFormatterConstants.EOL
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

    return rows.join(config.endOfLine);
  }

  private static generateHeaderRow<T>(meta: ExportColumnMeta<T>[], config: CsvFormatterConfig) {
    return meta.map(m => m.title).join(config.fieldSeparator);
  }

  private static generateItemRow<T>(meta: ExportColumnMeta<T>[], data: T, config: CsvFormatterConfig) {
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
