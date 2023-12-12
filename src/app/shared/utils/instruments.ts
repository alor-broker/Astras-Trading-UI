import { InstrumentType } from "../models/enums/instrument-type.model";
import { InstrumentKey } from "../models/instruments/instrument-key.model";
import { Instrument } from '../models/instruments/instrument.model';

/**
 * badge colors array
 */
export const instrumentsBadges = [
  '#FFFF00',
  '#FF0000',
  '#FFA500',
  '#008C00',
  '#00C4FF',
  '#0000FF',
  '#F100F1',
  '#800000',
];

/**
 * default badge color
 */
export const defaultBadgeColor = instrumentsBadges[0];

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
  }
  else if (cfi.startsWith('E')) {
    return InstrumentType.Stock;
  }
  else if (cfi.startsWith('MRC')) {
    return InstrumentType.CurrencyInstrument;
  }
  else if (cfi.startsWith('F')) {
    return InstrumentType.Futures;
  }
  else if (cfi.startsWith('O')) {
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

export function toInstrumentKey(instrument: Instrument | InstrumentKey): InstrumentKey {
  if (!instrument) {
    return instrument;
  }

  return {
    symbol: instrument.symbol,
    instrumentGroup: instrument.instrumentGroup,
    exchange: instrument.exchange,
    isin: instrument.isin
  };
}
