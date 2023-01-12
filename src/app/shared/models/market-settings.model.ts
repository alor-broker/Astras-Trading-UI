export interface ExchangeSettings {
  market: {
    [marketName: string]: MarketSettings
  },
  currencyInstrument: string;
  hasIssue?: boolean;
  hasPayments?: boolean;
  hasFinance?: boolean;
  hasDividends?: boolean;
  isInternational?: boolean;
  isDefault?: boolean;
  usesIsin?: boolean;
}

export interface MarketSettings {}
