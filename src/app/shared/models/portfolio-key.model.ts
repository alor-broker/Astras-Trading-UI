export enum MarketType {
  /** срочный **/
  Forward = 'forward',
  /** валютный **/
  ForeignExchange = 'foreignExchange',
  /** фондовый **/
  Stock = 'stock'
}

export interface PortfolioKey {
  portfolio: string,
  exchange: string,
  marketType?: MarketType
}
