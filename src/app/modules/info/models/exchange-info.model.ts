export interface ExchangeInfo {
  symbol: string,
  shortName: string,
  exchange: string,
  description: string,
  instrumentGroup?: string,
  isin: string,
  currency: string,
  type: string,
  lotsize: number
}
