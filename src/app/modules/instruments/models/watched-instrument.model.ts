import { Instrument } from "src/app/shared/models/instruments/instrument.model";

export interface WatchedInstrument {
  instrument: Instrument,
  price: number,
  prevTickPrice: number,
  dayChange: number,
  dayChangePerPrice: number,
  closePrice: number,
}
