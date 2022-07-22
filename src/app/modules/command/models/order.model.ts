import { Side } from "../../../shared/models/enums/side.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { StopOrderCondition } from "../../../shared/models/enums/stoporder-conditions";

export interface SubmitOrderResponse {
  message: string,
  // # of successfully places order
  orderNumber?: string,
  // Error code if something went wrong
  code?: string
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
}

export interface LimitOrderEdit extends Omit<LimitOrder, 'side'> {
  id: string;
}

export interface StopMarketOrder extends OrderBase {
  triggerPrice: number,
  condition: StopOrderCondition,
  stopEndUnixTime?: Date | number
}

export interface StopLimitOrder extends StopMarketOrder {
  price: number;
}
