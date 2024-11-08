import {Side} from "../enums/side.model";
import {PortfolioKey} from "../portfolio-key.model";
import {InstrumentKey} from "../instruments/instrument-key.model";

export interface TradeResponse {
  id: string; // 4205740801,
  orderNo: string; //  28452595240,
  symbol: string;
  shortName: string;
  brokerSymbol: string;
  exchange: string;
  date: Date; // 2021-12-28T06:43:23.0000000Z,
  board: string;
  qtyUnits: number; // 10,
  qtyBatch: number; // 1,
  qty: number; // 1,
  price: number; // 270,
  side: Side; // buy,
  existing: boolean; // true
  volume: number;
}

export interface Trade extends Omit<TradeResponse, 'symbol' | 'exchange' | 'board' | 'portfolio'> {
  ownedPortfolio: PortfolioKey;
  targetInstrument: InstrumentKey;
}

export interface RepoTradeResponse extends TradeResponse {
  repoSpecificFields: RepoSpecificFields;
}

export interface RepoTrade extends Trade {
  repoSpecificFields: RepoSpecificFields;
}

export interface RepoSpecificFields {
  repoRate: number;
  extRef: string;
  repoTerm: number;
  account: string;
  tradeTypeInfo: string;
  value: number;
  yield: number;
}
