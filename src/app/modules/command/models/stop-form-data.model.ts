import { StopOrderCondition } from "src/app/shared/models/enums/stoporder-conditions";
import { TimeInForce } from "../../../shared/models/commands/command-params.model";

export interface StopFormData {
  quantity: number,
  price?: number,
  triggerPrice: number,
  condition: StopOrderCondition,
  stopEndUnixTime?: Date,
  withLimit: boolean,
  isIceberg?: boolean,
  timeInForce?: TimeInForce,
  icebergFixed?: number,
  icebergVariance?: number
}
