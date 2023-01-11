export interface ExchangeSettings {
  market: {
    [marketName: string]: MarketSettings
  },
  currencyInstrument: string;
  isShowIssueTab?: boolean;
  isShowPaymentsTab?: boolean;
  isShowFinanceTab?: boolean;
  isShowDividendsTab?: boolean;
  isInternational?: boolean;
  isDefault?: boolean;
  isWithIsin?: boolean;
}

export interface MarketSettings {}
