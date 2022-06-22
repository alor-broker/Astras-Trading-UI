import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface WatchedInstrument {
  instrument: InstrumentKey,
  price: number,
  prevTickPrice: number,
  dayChange: number,
  dayChangePerPrice: number,
  closePrice: number,
  maxPrice: number;
  minPrice: number;
  volume: number;
  openPrice: number;
}
