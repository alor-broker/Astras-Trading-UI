import { StopOrderCondition } from '../enums/stoporder-conditions'
import { Order } from './order.model'

export interface StopOrder extends Order {
  triggerPrice: number,
  conditionType: string,
  validTillUnixTimestamp: Date
}

export interface StopOrderData extends Omit<StopOrder, ('conditionType' | 'triggerPrice')> {
  stopPrice: number,
  condition: string
}
