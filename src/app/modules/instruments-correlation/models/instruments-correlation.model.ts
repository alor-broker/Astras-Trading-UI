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

export interface InstrumentsCorrelationResponse {
  correlation: {
    [key: string]: {
      [key: string]: number
    };
  };

  cointegration: {
    [key: string]: {
      [key: string]: number
    };
  }
}
