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

export class PortfolioKeyEqualityComparer {
  public static equals(a?: PortfolioKey | null, b?: PortfolioKey | null) {
    return a?.portfolio === b?.portfolio && a?.exchange === b?.exchange;
  }
}
