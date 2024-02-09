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
  priceStep: number;
  marginbuy?: number;
  marginsell?: number;
  exchangeSettings?: ExchangeSettings;
  expirationDate: Date | null;
  cfiCode: string | null;
}
