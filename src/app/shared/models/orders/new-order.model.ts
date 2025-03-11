import {Side} from "../enums/side.model";
import {InstrumentKey} from "../instruments/instrument-key.model";
import {LessMore} from "../enums/less-more.model";
import {
  OrderType, Reason,
  TimeInForce
} from "./order.model";

export interface OrderMeta {
  trackId?: string;
}

export interface NewOrderBase {
  side: Side;
  instrument: InstrumentKey;
  quantity: number;
  meta?: OrderMeta;
  allowMargin?: boolean;
}

export interface NewMarketOrder extends NewOrderBase {
}

export interface NewLimitOrder extends NewOrderBase {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
  orderEndUnixTime?: number;
  reason?: Reason;
}

export interface NewStopMarketOrder extends NewOrderBase {
  triggerPrice: number;
  condition: LessMore;
  stopEndUnixTime?: Date;
  activate?: boolean;
}

export interface NewStopLimitOrder extends NewStopMarketOrder {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
}

export interface OrderCommandResult {
  isSuccess: boolean;
  message: string;
  orderNumber?: string;
}

export type NewLinkedOrder = (NewLimitOrder | NewStopLimitOrder | NewStopMarketOrder) & {
  type: OrderType.Limit | OrderType.StopMarket | OrderType.StopLimit;
};
