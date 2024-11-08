import {
  NewLimitOrder,
  NewLinkedOrder,
  NewMarketOrder,
  NewStopLimitOrder,
  NewStopMarketOrder,
  OrderCommandResult
} from "../../models/orders/new-order.model";
import { Observable } from "rxjs";
import {
  LimitOrderEdit,
  StopLimitOrderEdit,
  StopMarketOrderEdit
} from "../../models/orders/edit-order.model";
import { OrderType } from "../../models/orders/order.model";
import {
  ExecutionPolicy,
  SubmitGroupResult
} from "../../models/orders/orders-group.model";
import { OrdersConfig } from "../../models/orders/orders-config.model";
import { InjectionToken } from "@angular/core";

export const ORDER_COMMAND_SERVICE_TOKEN = new InjectionToken<OrderCommandService>('OrderCommandServiceToken');

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
