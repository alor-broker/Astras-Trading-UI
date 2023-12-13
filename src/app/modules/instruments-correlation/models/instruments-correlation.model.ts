import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

export enum DetrendType {
  Constant = 'constant',
  Linear = 'linear',
  Logarithmic = 'logarithmic'
}

export interface InstrumentsCorrelationRequest {
  instruments: InstrumentKey[];
  days: number;
  detrendType: DetrendType;
}

export interface CorrelationMatrix {
  correlation: {
    [key: string]: {
      [key: string]: number;
    };
  };

  cointegration: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

export interface InstrumentsCorrelationResponse {
  data?: CorrelationMatrix;
  errorCode?: InstrumentsCorrelationErrorCodes;
  errorMessage?: string;
}

export enum InstrumentsCorrelationErrorCodes {
  EmptyTickersList = 'EMPTY_TICKERS_LIST',
  ShortTickersList = 'SHORT_TICKERS_LIST',
  NotTradingInstruments = 'NOT_TRADING_INSTRUMENTS',
  Unknown = 'UNKNOWN'
}
