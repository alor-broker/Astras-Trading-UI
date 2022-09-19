import { Side } from "../enums/side.model";
import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";
import { StopOrderCondition } from "../enums/stoporder-conditions";

export interface EditParams {
  type: string,
  price?: number,
  orderId: string,
  quantity: number,
  instrument: InstrumentKey,
  user: PortfolioKey,
  side: Side,
  stopEndUnixTime?: Date | number,
  triggerPrice?: number,
  condition?: StopOrderCondition,
}
