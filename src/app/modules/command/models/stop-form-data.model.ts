
import { TimeInForce } from "../../../shared/models/commands/command-params.model";
import {LessMore} from "../../../shared/models/enums/less-more.model";

export interface StopFormData {
  quantity: number,
  price?: number,
  triggerPrice: number,
  condition: LessMore,
  stopEndUnixTime?: Date,
  withLimit: boolean,
  isIceberg?: boolean,
  timeInForce?: TimeInForce,
  icebergFixed?: number,
  icebergVariance?: number
}
