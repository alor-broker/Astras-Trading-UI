export enum OptionSide {
  Call = 'call',
  Put = 'put'
}

export enum OptionParameters {
  Price = 'price',
  Delta = 'delta',
  Gamma = 'gamma',
  Vega = 'vega',
  Theta = 'theta',
  Rho = 'rho',
  Ask = 'ask',
  Bid = 'bid'
}

export interface OptionKey {
  symbol: string;
  exchange: string;
}

export interface Option extends OptionKey {
  description: string;
  expirationDate: Date;
  strikePrice: number;
  optionSide: OptionSide;
  optionType: string;
  doesImplyVolatility: boolean;
  underlyintPrice: number;
  fixedSpotDiscount: number;
  projectedSpotDiscount: number;
  ask: number;
  bid: number;
  volatility: number;
  calculations: {
    price: number;
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
  };
}

export interface UnderlyingAsset {
  symbol: string;
  shortName: string;
  exchange: string;
  board: string;
  type: string;
  cfiCode: string;
  lastPrice: number;
  minStep: number;
}

export interface InstrumentOptions {
  underlyingAsset: UnderlyingAsset;
  options: Option[];
}

export interface OptionDetails extends Option {

}
