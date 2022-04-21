import { InstrumentKey } from "./instrument-key.model";

export interface Instrument extends InstrumentKey {
  isin?: string
}
