import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface WatchlistCollection {
  collection: Watchlist[];
}

export interface Watchlist {
  id: string,
  title: string,
  isDefault?: boolean,
  items: InstrumentKey[]
}

export interface PresetWatchlistCollection {
  list: PresetWatchlist[];
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
