import { TimeInForce } from "../../../shared/models/commands/command-params.model";
import { Side } from "../../../shared/models/enums/side.model";

export interface LimitFormData {
  instrumentGroup?: string;
  quantity: number;
  price: number;
  isIceberg?: boolean;
  timeInForce?: TimeInForce;
  icebergFixed?: number;
  icebergVariance?: number;
  topOrderPrice?: number;
  topOrderSide?: Side;
  bottomOrderPrice?: number;
  bottomOrderSide?: Side;
}
