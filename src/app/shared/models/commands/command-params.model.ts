import { CommandType } from "../enums/command-type.model";
import { InstrumentKey } from "../instruments/instrument-key.model";
import { PortfolioKey } from "../portfolio-key.model";
import { Side } from "../enums/side.model";
import {TimeInForce} from "../orders/order.model";

export interface CommandParams {
  instrument: InstrumentKey;
  type: CommandType;
  price?: number;
  user?: PortfolioKey;
  quantity: number;
  stopEndUnixTime?: number;
  isIceberg?: boolean;
  timeInForce?: TimeInForce;
  icebergFixed?: number;
  icebergVariance?: number;
  topOrderPrice?: number | null;
  topOrderSide?: Side;
  bottomOrderPrice?: number | null;
  bottomOrderSide?: Side;
}


