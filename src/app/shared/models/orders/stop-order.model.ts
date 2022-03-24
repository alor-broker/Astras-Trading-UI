import { StopOrderCondition } from '../enums/stoporder-conditions'
import { Order } from './order.model'

export interface StopOrder extends Order {
  triggerPrice: number,
  conditionType: StopOrderCondition,
  validTillUnixTimestamp: Date
}
