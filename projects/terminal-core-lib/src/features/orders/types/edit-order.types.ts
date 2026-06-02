import {
  NewLimitOrder,
  NewStopMarketOrder
} from './new-order.types';
import {TimeInForce} from '@terminal-core-lib/features/orders/types/orders.types';

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
