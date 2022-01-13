import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";

export interface InstrumentAdditions extends InstrumentKey{
  shortName: string,
  fullName: string,
  icon?: string
}
