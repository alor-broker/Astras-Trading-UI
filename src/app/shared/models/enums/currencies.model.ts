// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ConvertF = ((k: string) => string | boolean);

export class CurrencyInstrument {
  static [key: string]: string | ConvertF;
  static RUB = 'RUB';
  static EUR = 'EUR_RUB__TOM';
  static USD = 'USD000UTSTOM';
  static CHF = 'CHFRUB_TOM';
  static CNY = 'CNYRUB_TOM';
  static TRY = 'TRYRUB_TOM';
  static HKD = 'HKDRUB_TOM';
  static toCode(instrument: string) {
    return (CurrencyCode)[instrument] as string;
  }
}

export class CurrencyCode {
  static [key: string]: string | ConvertF;
  static RUB = 'RUB';
  static EUR = 'EUR';
  static USD = 'USD';
  static CHF = 'CHF';
  static CNY = 'CNY';
  static TRY = 'TRY';
  static HKD = 'HKD';
  static toInstrument(code: string) {
    return (CurrencyInstrument)[code] as string;
  }
  static isCurrency(symbol: string) : boolean {
    return !!Object.keys(CurrencyCode).find(k => k == symbol);
  }
}
