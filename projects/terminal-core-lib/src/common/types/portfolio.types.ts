export enum MarketType {
  /** срочный **/
  Forward = 'forward',
  /** валютный **/
  ForeignExchange = 'foreignExchange',
  /** фондовый **/
  Stock = 'stock',
  /** единый **/
  United = 'united',
}

export interface PortfolioKey {
  portfolio: string;
  exchange: string;
  marketType?: MarketType;
}

export interface PortfolioMeta {
  portfolio: string;
  tks: string;
  market: string;
  agreement: string;
  isVirtual: boolean;
}

export type PortfolioExtended = PortfolioMeta & PortfolioKey;
