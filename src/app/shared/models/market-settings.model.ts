export interface MarketExchange {
  exchange: string;
  settings: ExchangeSettings;
}

export interface ExchangeSettings {
  // Default currency to display data (used in blotter).
  defaultPortfolioCurrencyInstrument: string;
  hasIssue?: boolean;
  hasPayments?: boolean;
  hasFinance?: boolean;
  hasDividends?: boolean;
  isInternational?: boolean;
  isDefault?: boolean;
  // This instrument will be selected if dashboard has no selection (for example when dashboard just created)
  defaultInstrument?: {
    symbol: string;
    instrumentGroup?: string;
    exchange?: string;
  };
  // Exchange timezone. Used in TV chart to correctly display candle timestamps
  timezone: string;
  // Trading session in format of TV chart. See https://www.tradingview.com/charting-library-docs/latest/connecting_data/Trading-Sessions
  defaultTradingSession: string;
  hasInstruments?: boolean;
}

export interface CurrencyFormat {
  formatCode: string;
  locale: string;
  displaySymbol?: string;
}

export interface PortfolioCurrency {
  positionSymbol: string;
  // Instrument to select when this currency in selected in blotter
  exchangeInstrument: {
    symbol: string;
    exchange?: string;
  } | null;
  format: CurrencyFormat | null;
}

export interface CurrencySettings {
  // Exchange from which you can request exchange rates
  defaultCurrencyExchange: string;

  // Base currency against which conversion to other currencies occurs.
  baseCurrency: string;

  // Currency has different symbols. This field is used to map currency to instrument
  // Should contain record for base currency
  portfolioCurrencies: PortfolioCurrency[];
}

export interface MarketSettings {
  exchanges: MarketExchange[];
  currencies: CurrencySettings;
}
