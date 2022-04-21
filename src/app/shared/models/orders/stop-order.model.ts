import { Order } from './order.model';

export interface StopOrder extends Order {
  triggerPrice: number,
  conditionType: string,
  endTime: Date,
}

export interface StopOrderData extends Omit<StopOrder, ('conditionType' | 'triggerPrice')> {
  stopPrice: number,
  condition: string
}
