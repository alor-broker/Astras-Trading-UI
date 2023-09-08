import {Side} from "../enums/side.model";
import {InstrumentKey} from "../instruments/instrument-key.model";
import {LessMore} from "../enums/less-more.model";
import {TimeInForce} from "./order.model";

export interface NewOrderBase {
  side: Side;
  instrument: InstrumentKey;
  quantity: number;
}

export interface NewMarketOrder extends NewOrderBase {
}

export interface NewLimitOrder extends NewOrderBase {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
  topOrderPrice?: number | null;
  topOrderSide?: Side;
  bottomOrderPrice?: number | null;
  bottomOrderSide?: Side;
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

export interface SubmitOrderResponse {
  message: string;
  // # of successfully places order
  orderNumber?: string;
  // Error code if something went wrong
  code?: string;
}

export interface SubmitOrderResult {
  isSuccess: boolean;
  orderNumber?: string;
}
