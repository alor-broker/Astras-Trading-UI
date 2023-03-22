import { TimeInForce } from "../../../shared/models/commands/command-params.model";

export interface LimitFormData {
  instrumentGroup?: string;
  quantity: number;
  price: number;
  isIceberg?: boolean;
  timeInForce?: TimeInForce;
  icebergFixed?: number;
  icebergVariance?: number;
}
