import {InstrumentKey} from '../types/instrument.types';

export class InstrumentEqualityComparer {
  /**
   * Returns equality of two instruments
   * @param a - first instrument to check.
   * @param b - second instrument to check.
   * @returns boolean
   */
  public static equals(a: InstrumentKey | null, b: InstrumentKey | null): boolean {
    return a?.symbol === b?.symbol
      && a?.exchange === b?.exchange
      && a?.isin == b?.isin
      && a?.instrumentGroup == b?.instrumentGroup;
  }
}

export class InstrumentKeyHelper {
  /**
   * Cleans shape from extra fields
   */
  static toInstrumentKey(shape: {
    symbol: string;
    exchange: string;
    isin?: string;
    instrumentGroup?: string | null;
  }): InstrumentKey {
    return {
      symbol: shape.symbol,
      exchange: shape.exchange,
      isin: shape.isin,
      instrumentGroup: shape.instrumentGroup
    };
  }
}
