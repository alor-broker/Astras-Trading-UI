export interface InstrumentKey {
  instrumentGroup?: string,
  symbol: string,
  exchange: string,
  isin?: string,
}

export class InstrumentEqualityComparer {
  public static equals(a: InstrumentKey, b: InstrumentKey) {
    return a?.isin === b?.isin
    || (a?.symbol === b?.symbol && a?.exchange === b?.exchange && a?.instrumentGroup == b?.instrumentGroup);
  }
}
