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
