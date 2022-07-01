import { InstrumentType } from "../models/enums/instrument-type.model";
import { InstrumentKey } from "../models/instruments/instrument-key.model";

/**
 * Determines the category of instrument by CFI code
 * @param cfi cfi code
 * @returns InstrumentType
 */
export function getTypeByCfi(cfi: string | undefined) {
  if (!cfi) {
    return InstrumentType.Other;
  }
  if (cfi.startsWith('DB')) {
    return InstrumentType.Bond;
  } else if (cfi.startsWith('E')) {
    return InstrumentType.Stock;
  } else if (cfi.startsWith('MRC')) {
    return InstrumentType.CurrencyInstrument;
  } else if (cfi.startsWith('F')) {
    return InstrumentType.Futures;
  } else if (cfi.startsWith('O')) {
    return InstrumentType.Options;
  }
  return InstrumentType.Other;
}


/**
 * Responsible for check instrument equality
 */
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
