import {Instrument} from '@terminal-core-lib/common/types/instrument.types';

export interface WatchedInstrument {
  recordId: string;
  addTime: number;
  instrument: Instrument;
  price?: number;
  prevTickPrice?: number;
  priceChange: number;
  priceChangeRatio: number;
  closePrice: number;
  maxPrice: number;
  minPrice: number;
  volume: number;
  openPrice: number;
  favoriteOrder?: number | null;
}
