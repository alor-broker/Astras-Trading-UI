import { ExchangeSettings } from "../../../shared/models/market-settings.model";

export interface ExchangeInfo {
  symbol: string;
  shortName: string;
  exchange: string;
  description: string;
  instrumentGroup?: string | null;
  isin: string;
  currency: string;
  type: string;
  lotsize: number;
  marginbuy?: number;
  marginsell?: number;
  exchangeSettings?: ExchangeSettings;
}
