import {TimeInForce} from "./order.model";
import {NewLimitOrder, NewStopMarketOrder} from "./new-order.model";

export interface LimitOrderEdit extends NewLimitOrder {
  orderId: string;
}

export interface StopMarketOrderEdit extends NewStopMarketOrder {
  orderId: string;
}

export interface StopLimitOrderEdit extends StopMarketOrderEdit {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
}
