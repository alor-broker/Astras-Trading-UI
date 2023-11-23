import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";

export interface SyntheticInstrumentKey {
  isSynthetic: true;
  parts: SyntheticInstrumentPart[];
}

export interface RegularInstrumentKey {
  isSynthetic: false;
  instrument: InstrumentKey;
}

export type RegularOrSyntheticInstrumentKey = SyntheticInstrumentKey | RegularInstrumentKey;

export interface OperatorPart {
  isSpreadOperator: true;
  value: string;
}

export interface InstrumentDataPart<T = InstrumentKey> {
  isSpreadOperator: false;
  value: T;
}

export type SyntheticInstrumentPart<T = InstrumentKey> = OperatorPart | InstrumentDataPart<T>;
