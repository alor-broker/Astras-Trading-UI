import { StopOrderCondition } from "src/app/shared/models/enums/stoporder-conditions";

export interface StopFormData {
  quantity: number,
  price?: number,
  triggerPrice: number,
  condition: StopOrderCondition,
  stopEndUnixTime?: Date,
  withLimit: boolean
}
