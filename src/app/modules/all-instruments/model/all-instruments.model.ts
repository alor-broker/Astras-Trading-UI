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
    dailyGrowth?: number;
    dailyGrowthPercent?: number;
    price?: number;
    tradeVolume?: number;
  };
  currencyInformation?: {
    nominal?: string;
  };
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
