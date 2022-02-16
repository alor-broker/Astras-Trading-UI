import { Instrument } from "src/app/shared/models/instruments/instrument.model";

export interface InstrumentAdditions extends Instrument{
  shortName: string,
  fullName: string,
  icon?: string
}
