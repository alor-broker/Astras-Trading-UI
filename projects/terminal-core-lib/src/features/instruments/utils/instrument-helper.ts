import {
  FutureType,
  InstrumentType
} from '../../../common/types/instrument.types';

export class InstrumentHelper {
  /**
   * Determines the category of instrument by CFI code
   * @param cfi cfi code
   * @returns InstrumentType
   */
  static getTypeByCfi(cfi: string | undefined): InstrumentType {
    if (cfi == null) {
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
   * Determines the type of future by CFI code
   * @param cfi cfi code
   * @returns FutureType
   */
  static getFutureType(cfi: string): FutureType | undefined {
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
}
