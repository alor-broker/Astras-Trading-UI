import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface WatchListCollection {
  collection: WatchList[]
}

export interface WatchList {
  id: string,
  title: string,
  isDefault?: boolean,
  items: InstrumentKey[]
}
