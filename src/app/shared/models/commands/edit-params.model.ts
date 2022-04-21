import { Side } from "../enums/side.model";
import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";

export interface EditParams {
  type: string,
  price?: number,
  orderId: string,
  quantity: number,
  instrument: InstrumentKey,
  user: PortfolioKey,
  side: Side
}
