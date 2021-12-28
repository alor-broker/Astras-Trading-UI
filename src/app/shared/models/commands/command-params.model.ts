import { Side } from "../enums/side.model";
import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";

export interface CommandParams {
  instrument: InstrumentKey
  side: Side,
  price?: number,
  user?: PortfolioKey
}
