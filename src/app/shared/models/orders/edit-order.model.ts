import {TimeInForce} from "./order.model";
import {NewLimitOrder, NewStopMarketOrder} from "./new-order.model";

export interface LimitOrderEdit extends Omit<NewLimitOrder, 'side' | 'topOrderPrice' | 'topOrderSide' | 'bottomOrderPrice' | 'bottomOrderSide'> {
  id: string;
}

export interface StopMarketOrderEdit extends NewStopMarketOrder {
  id: string;
}

export interface StopLimitOrderEdit extends StopMarketOrderEdit {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
}
