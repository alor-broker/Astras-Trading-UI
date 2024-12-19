import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { InstrumentType } from "../../../shared/models/enums/instrument-type.model";

export interface InstrumentSummary extends Instrument {
  typeByCfi: InstrumentType;
  board: string;
}
