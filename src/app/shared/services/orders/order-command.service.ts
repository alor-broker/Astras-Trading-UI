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

export abstract class OrderCommandService {
  abstract submitMarketOrder(order: NewMarketOrder, portfolio: string): Observable<OrderCommandResult>;

  abstract submitLimitOrder(order: NewLimitOrder, portfolio: string): Observable<OrderCommandResult>;

  abstract submitStopMarketOrder(order: NewStopMarketOrder, portfolio: string): Observable<OrderCommandResult>;

  abstract submitStopLimitOrder(order: NewStopLimitOrder, portfolio: string): Observable<OrderCommandResult>;

  abstract submitOrdersGroup(
    orders: NewLinkedOrder[],
    portfolio: string,
    executionPolicy: ExecutionPolicy
  ): Observable<SubmitGroupResult | null>;

  abstract submitLimitOrderEdit(orderEdit: LimitOrderEdit, portfolio: string): Observable<OrderCommandResult>;

  abstract submitStopMarketOrderEdit(orderEdit: StopMarketOrderEdit, portfolio: string): Observable<OrderCommandResult>;

  abstract submitStopLimitOrderEdit(orderEdit: StopLimitOrderEdit, portfolio: string): Observable<OrderCommandResult>;

  abstract cancelOrders(cancelRequests: {
    orderId: string;
    portfolio: string;
    exchange: string;
    orderType: OrderType;
  }[]): Observable<OrderCommandResult[]>;
}
