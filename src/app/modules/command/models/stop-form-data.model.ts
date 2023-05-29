
import { TimeInForce } from "../../../shared/models/commands/command-params.model";
import {LessMore} from "../../../shared/models/enums/less-more.model";
import { Side } from "../../../shared/models/enums/side.model";

export interface StopFormData {
  quantity: number;
  price?: number;
  triggerPrice: number;
  condition: LessMore;
  stopEndUnixTime?: Date;
  withLimit: boolean;
  isIceberg?: boolean;
  timeInForce?: TimeInForce;
  icebergFixed?: number;
  icebergVariance?: number;
  linkedOrder: LinkedOrderFormData;
  allowLinkedOrder?: boolean;
}

export interface LinkedOrderFormData {
  quantity?: number;
  triggerPrice?: number;
  price?: number;
  stopEndUnixTime?: Date;
  condition?: LessMore;
  withLimit?: boolean;
  side?: Side;
}
