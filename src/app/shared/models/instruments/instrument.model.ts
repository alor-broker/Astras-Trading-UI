import { InstrumentType } from "../enums/instrument-type.model";
import { InstrumentKey } from "./instrument-key.model";

export interface Instrument extends InstrumentKey {
  isin?: string
}
