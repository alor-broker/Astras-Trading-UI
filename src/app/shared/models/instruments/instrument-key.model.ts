export interface InstrumentKey {
  instrumentGroup?: string,
  symbol: string,
  exchange: string
}

export class InstrumentEqualityComparer {
  public static equals(a: InstrumentKey, b: InstrumentKey) {
    return a?.symbol === b?.symbol && a?.exchange === b?.exchange && a?.instrumentGroup == b?.instrumentGroup;
  }
}
