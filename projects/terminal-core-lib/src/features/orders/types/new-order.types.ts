import {Side} from '../../../common/types/side.types';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {Condition} from '../../../common/types/condition.types';
import {
  OrderType,
  TimeInForce
} from './orders.types';

export enum Reason {
  ForceCloseOrder = 'ForceCloseOrder',
  DebtLevy = 'DebtLevy',
  Voice = 'Voice'
}

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
  timeInForce?: TimeInForce;
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
  condition: Condition;
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
