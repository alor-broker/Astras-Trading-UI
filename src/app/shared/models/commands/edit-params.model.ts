import { Side } from "../enums/side.model";
import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";
import {LessMore} from "../enums/less-more.model";
import {TimeInForce} from "../orders/order.model";

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
  condition?: LessMore | null,
  cancelled?: () => void,
  timeInForce?: TimeInForce | null,
  icebergFixed?: number | null,
  icebergVariance?: number | null,
}
