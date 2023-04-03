import { Side } from "../enums/side.model";
import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";
import { StopOrderCondition } from "../enums/stoporder-conditions";
import { TimeInForce } from "./command-params.model";

export interface EditParams {
  type: string,
  price?: number,
  orderId: string,
  quantity: number,
  instrument: InstrumentKey,
  user: PortfolioKey,
  side: Side,
  stopEndUnixTime?: Date | number | null,
  triggerPrice?: number | null,
  condition?: StopOrderCondition | null,
  cancelled?: () => void,
  timeInForce?: TimeInForce | null,
  icebergFixed?: number | null,
  icebergVariance?: number | null,
}
