import { Instrument } from '../../../shared/models/instruments/instrument.model';

export interface WatchedInstrument {
  recordId: string;
  instrument: Instrument;
  price: number;
  prevTickPrice: number;
  dayChange: number;
  dayChangePerPrice: number;
  closePrice: number;
  maxPrice: number;
  minPrice: number;
  volume: number;
  openPrice: number;
}
