import { Side } from "../../../shared/models/enums/side.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { TimeInForce } from "../../../shared/models/commands/command-params.model";
import {LessMore} from "../../../shared/models/enums/less-more.model";

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

export interface OrderBase {
  side: Side;
  instrument: InstrumentKey;
  quantity: number;
}

export interface MarketOrder extends OrderBase {
}

export interface LimitOrder extends OrderBase {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
}

export interface StopOrder extends OrderBase {
  triggerPrice: number,
  conditionType: LessMore,
  endTime: number,
}

export interface LimitOrderEdit extends Omit<LimitOrder, 'side'> {
  id: string;
}

export interface StopMarketOrderEdit extends StopOrder {
  id: string;
}

export interface StopLimitOrderEdit extends StopOrder {
  id: string;
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
}

export interface StopMarketOrder extends OrderBase {
  triggerPrice: number;
  condition: LessMore;
  stopEndUnixTime?: Date | number;
}

export interface StopLimitOrder extends StopMarketOrder {
  price: number;
  icebergFixed?: number;
  icebergVariance?: number;
  timeInForce?: TimeInForce;
}
