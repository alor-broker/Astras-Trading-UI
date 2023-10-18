import {
  InstrumentKey
} from "./instrument-key.model";

export interface Instrument extends InstrumentKey {
  shortName: string,
  description: string,
  currency: string,
  minstep: number,
  lotsize?: number,
  cfiCode?: string,
  type?: string,
  marginbuy?: number,
  marginsell?: number,
}
