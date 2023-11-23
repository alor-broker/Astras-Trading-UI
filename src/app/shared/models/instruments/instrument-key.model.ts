export interface InstrumentKey {
  instrumentGroup?: string | null;
  symbol: string;
  exchange: string;
  isin?: string;
}
