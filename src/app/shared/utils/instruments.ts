import { InstrumentType } from "../models/enums/instrument-type.model";
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
