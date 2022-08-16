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
}

export interface AllInstrumentsFilters {
  limit?: number;
  offset?: number;
  descending?: boolean;
  orderBy?: string;
  query?: string;
  exchange?: string;
  shortName?: string;
  marketType?: string;
}
