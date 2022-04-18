type ConvertF = ((k: string) => string | boolean);

export class CurrencyInstrument {
  static [key: string]: string | ConvertF;
  static RUB = 'RUB';
  static EUR = 'EUR_RUB__TOM';
  static USD = 'USD000UTSTOM';
  static toCode(instrument: string) {
    return (CurrencyCode)[instrument] as string;
  }
}

export class CurrencyCode {
  static [key: string]: string | ConvertF;
  static RUB = 'RUB';
  static EUR = 'EUR';
  static USD = 'USD';
  static toInstrument(code: string) {
    return (CurrencyInstrument)[code] as string;
  }
  static isCurrency(symbol: string) : boolean {
    return !!Object.keys(CurrencyCode).find(k => k == symbol);
  }
}
