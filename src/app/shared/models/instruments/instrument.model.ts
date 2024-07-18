import {
  InstrumentKey
} from "./instrument-key.model";
import { Market } from "../../../../generated/graphql.types";

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
