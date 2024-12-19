import {
  FutureType,
  InstrumentType
} from "../models/enums/instrument-type.model";
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
  '#800000'
];

export const additionalInstrumentsBadges = [
  '#E57373',
  '#F06292',
  '#BA68C8',
  '#9575CD',
  '#7986CB',
  '#64B5F6',
  '#4FC3F7',
  '#4DD0E1',
  '#4DB6AC',
  '#81C784',
  '#AED581',
  '#DCE775',
  '#FFF176',
  '#FFD54F',
  '#FFB74D',
  '#FF8A65',
  '#A1887F',
  '#90A4AE',
  '#B0BEC5',
  '#CE93D8'
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
export function getTypeByCfi(cfi: string | undefined): InstrumentType {
  if (cfi == null) {
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
 * Determines the type of future by CFI code
 * @param cfi cfi code
 * @returns InstrumentType
 */
export function getFutureType(cfi: string): FutureType | undefined {
  // FFXPSX - example CFI for future
  // see https://en.wikipedia.org/wiki/ISO_10962 for CFI code semantic.
  const futureTypeCode = cfi[3];

  if (futureTypeCode === 'P') {
    return FutureType.Deliverable;
  }

  if (futureTypeCode === 'C') {
    return FutureType.Settlement;
  }

  if (futureTypeCode === 'N') {
    return FutureType.NonDeliverable;
  }

  return undefined;
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
  return {
    symbol: instrument.symbol,
    instrumentGroup: instrument.instrumentGroup,
    exchange: instrument.exchange,
    isin: instrument.isin
  };
}
