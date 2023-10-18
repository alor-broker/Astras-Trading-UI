import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export enum WatchlistType {
  DefaultList= 'default',
  HistoryList = 'history'
}

export interface WatchlistCollection {
  collection: Watchlist[]
}

export interface WatchlistItem extends InstrumentKey {
  recordId: string;
  addTime?: number;
  favoriteOrder?: number | null;
}

export interface Watchlist {
  id: string,
  title: string,
  isDefault?: boolean,
  type?: WatchlistType,
  items: WatchlistItem[]
}

export interface PresetWatchlistCollection {
  list: PresetWatchlist[]
}

export interface PresetWatchlist {
  name: string,
  papers: PresetWatchlistItem[]
}

export interface PresetWatchlistItem {
  symbol: string,
  exchange: string,
  board?: string
}
