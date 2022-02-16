import { InstrumentType } from "src/app/shared/models/enums/instrument-type.model";

export interface InstrumentSelect {
  symbol: string,
  shortName: string,
  exchange: string,
  description: string,
  instrumentGroup: string,
  isin: string,
  currency: string
}
