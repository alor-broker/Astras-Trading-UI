import {
  Market,
  TradingStatus
} from '../../../common/types/instrument.types';

export interface InstrumentSearchResponse {
  symbol: string;
  shortname: string;
  exchange: string;
  description: string;
  board?: string;
  primary_board: string;
  ISIN: string;
  currency: string;
  type?: string;
  lotsize?: number;
  facevalue?: number;
  cfiCode?: string;
  cancellation?: Date;
  minstep?: number;
  rating?: number;
  marginbuy?: number;
  marginsell?: number;
  marginrate?: number;
  pricestep?: number;
  priceMax?: number;
  priceMin?: number;
  theorPrice?: number;
  theorPriceLimit?: number;
  volatility?: number;
  yield?: number | null;
  tradingStatus?: TradingStatus;
  tradingStatusInfo?: string;
  complexProductCategory?: string;
  market: Market;
}

export interface SearchFilter {
  query: string;
  limit: number;
  sector?: string;
  cficode?: string;
  exchange?: string;
  instrumentGroup?: string;
}

export interface Board {
  exchange: string;
  code: string;
  description: string;
}
