import { InstrumentKey } from "src/app/shared/models/instruments/instrument-key.model";

export interface WatchedInstrument {
  instrument: InstrumentKey,
  price: number,
  prevTickPrice: number,
  dayChange: number,
  dayChangePerPrice: number,
  closePrice: number,
}
