import { InstrumentKey } from "./instrument-key.model";

export interface Instrument extends InstrumentKey {
  isin?: string,
  shortName: string,
  description: string,
  currency: string,
  minstep: number,
  lotsize?: number,
  cfiCode?: string
}

export class InstrumentIsinEqualityComparer {
  public static equals(a: Instrument, b: Instrument) {
    return (!!a.isin && !!b.isin && a.isin === b.isin)
      || (a.symbol === b.symbol && a.exchange === b.exchange);
  }
}
