export interface ExchangeSettings {
  market: {
    [marketName: string]: MarketSettings;
  };
  currencyInstrument: string;
  hasIssue?: boolean;
  hasPayments?: boolean;
  hasFinance?: boolean;
  hasDividends?: boolean;
  isInternational?: boolean;
  isDefault?: boolean;
  defaultInstrument?: {
    symbol: string;
    instrumentGroup?: string;
  };
  timezone: string;
  defaultTradingSession: string;
}

export interface MarketSettings {}
