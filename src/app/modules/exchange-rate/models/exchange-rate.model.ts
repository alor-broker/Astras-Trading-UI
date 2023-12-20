export interface RateValue {
  rate: number;
  sourceSymbol: string | null;
}

export interface Rate {
  fromCurrency: string;
  toCurrency: string;
  symbolTom: string;
  lastPrice: number;
}
