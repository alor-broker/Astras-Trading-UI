import { Instrument } from '../../../shared/models/instruments/instrument.model';

export interface WatchedInstrument {
  recordId: string;
  addTime: number;
  instrument: Instrument;
  price?: number;
  prevTickPrice?: number;
  dayChange: number;
  dayChangePerPrice: number;
  closePrice: number;
  maxPrice: number;
  minPrice: number;
  volume: number;
  openPrice: number;
  favoriteOrder?: number | null;
}
