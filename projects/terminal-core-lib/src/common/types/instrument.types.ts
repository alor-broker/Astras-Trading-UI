export interface InstrumentKey {
  instrumentGroup?: string | null;
  symbol: string;
  exchange: string;
  isin?: string;
}

export enum TradingStatus {
  Break = 2,
  NormalPeriod = 17,
  Closed = 18,
  ClosingAuction = 102,
  ClosingPeriod = 103,
  LargePackagesAuction = 106,
  DiscreteAuction = 107,
  OpeningPeriod = 118,
  OpeningAuction = 119,
  ClosingPriceAuctionPeriod = 120
}

export enum Market {
  Be = 'BE',
  Curr = 'CURR',
  Fond = 'FOND',
  Forts = 'FORTS',
  Imex = 'IMEX',
  Info = 'INFO',
  Its = 'ITS',
  Marex = 'MAREX',
  Spbx = 'SPBX',
  Terex = 'TEREX',
  United = 'UNITED'
}

export enum InstrumentType {
  Bond = 'bond',
  Stock = 'stock',
  CurrencyInstrument = 'currency-instrument',
  Futures = 'futures',
  Options = 'options',
  Other = 'other',
}

export enum FutureType {
  Settlement = 'settlement',
  Deliverable = 'deliverable',
  NonDeliverable = 'nonDeliverable'
}

export interface Instrument extends InstrumentKey {
  shortName: string;
  description: string;
  currency: string;
  minstep: number;
  lotsize?: number;
  pricestep?: number;
  cfiCode?: string;
  type?: string;
  marginbuy?: number;
  marginsell?: number;
  expirationDate?: Date;
  tradingStatus?: TradingStatus;
  market?: Market;
}
