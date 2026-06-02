import {InjectionToken} from '@angular/core';
import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from './new-order.types';
import {
  ExecutionPolicy,
  SubmitGroupResult
} from './order-group.types';
import {Observable} from 'rxjs';
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from './edit-order.types';
import {OrderType} from './orders.types';

export interface LimitOrderConfig {
  isBracketsSupported: boolean;
  unsupportedFields: Record<string, boolean>;
}

export interface MarketOrderConfig {
  unsupportedFields: Record<string, boolean>;
}

export interface OrdersConfig {
  marketOrder: {
    isSupported: boolean;
    orderConfig: MarketOrderConfig | null;
  };
  limitOrder: {
    isSupported: boolean;
    orderConfig: LimitOrderConfig | null;
  };
  stopOrder: {
    isSupported: boolean;
  };
}

export interface OrderCommandService {
  submitMarketOrder(order: NewMarketOrder, portfolio: string): Observable<OrderCommandResult>;

  submitLimitOrder(order: NewLimitOrder, portfolio: string): Observable<OrderCommandResult>;

  submitStopMarketOrder(order: NewStopMarketOrder, portfolio: string): Observable<OrderCommandResult>;

  submitStopLimitOrder(order: NewStopLimitOrder, portfolio: string): Observable<OrderCommandResult>;

  submitOrdersGroup(
    orders: NewLinkedOrder[],
    portfolio: string,
    executionPolicy: ExecutionPolicy
  ): Observable<SubmitGroupResult | null>;

  submitLimitOrderEdit(orderEdit: LimitOrderEdit, portfolio: string): Observable<OrderCommandResult>;

  submitStopMarketOrderEdit(orderEdit: StopMarketOrderEdit, portfolio: string): Observable<OrderCommandResult>;

  submitStopLimitOrderEdit(orderEdit: StopLimitOrderEdit, portfolio: string): Observable<OrderCommandResult>;

  cancelOrders(cancelRequests: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[]): Observable<OrderCommandResult[]>;

  getOrdersConfig(): OrdersConfig;
}

export const ORDER_COMMAND_SERVICE_TOKEN = new InjectionToken<OrderCommandService>('OrderCommandServiceToken');
