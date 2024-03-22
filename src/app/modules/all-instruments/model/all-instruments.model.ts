import { GraphQlEdge, GraphQlPageInfo } from "../../../shared/models/graph-ql.model";

export interface AllInstrumentsResponse {
  instruments: {
    edges: GraphQlEdge<AllInstrumentsNode>[];
    pageInfo: GraphQlPageInfo;
  };
}

export interface AllInstrumentsNode {
  basicInformation?: {
    symbol?: string;
    shortName?: string;
    type?: string;
    exchange?: string;
    market?: string;
  };
  financialAttributes?: {
    tradingStatus?: string;
    tradingStatusInfo?: string;
    currency?: string;
  };
  additionalInformation?: {
    cancellation?: Date;
    priceMultiplier?: number;
    complexProductCategory?: string;
  };
  boardInformation?: {
    board?: string;
  };
  tradingDetails?: {
    lotSize?: number;
    minStep?: number;
    priceMax?: number;
    priceMin?: number;
    priceStep?: number;
    rating?: number;
  };
  currencyInformation?: {
    nominal?: string;
  };
  realTimeData?: {
    dailyGrowth?: number;
    dailyGrowthPercent?: number;
    price?: number;
    tradeVolume?: number;
    yield?: number;
  };
}

export interface AllInstruments {
  cfiCode: string;
  currency: string;
  dailyGrowth: number;
  dailyGrowthPercent: number;
  description: string;
  exchange: string;
  lotSize: number;
  name: string;
  price: number;
  priceMax: number;
  priceMin: number;
  priceScale: number;
  shortName: string;
  tradeVolume: number;
  tradingStatusCode: number;
  tradingStatusInfo: string;
  yield: number;
  badges?: string[];
  id: string;
}

export interface AllInstrumentsFilters {
  limit?: number;
  offset?: number;
  descending?: boolean;
  orderBy?: string;
  query?: string;
  exchange?: string;
  marketType?: string;
  currency?: string;
  priceFrom?: string;
  priceTo?: string;
  dailyGrowthFrom?: string;
  dailyGrowthTo?: string;
  tradeVolumeFrom?: string;
  tradeVolumeTo?: string;
}
