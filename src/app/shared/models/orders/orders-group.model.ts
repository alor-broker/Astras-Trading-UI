import { NzTreeNodeOptions } from "ng-zorro-antd/core/tree/nz-tree-base-node";
import { Order } from "./order.model";
import { StopOrder } from "./stop-order.model";

export enum ExecutionPolicy {
  OnExecuteOrCancel = 'OnExecuteOrCancel',
  IgnoreCancel = 'IgnoreCancel',
  IgnoreCancelEditingSupport = 'IgnoreCancelEditingSupport',
  TriggerBracketOrders = 'TriggerBracketOrders'
}

export interface CreateOrderGroupReq {
  orders: {
    orderId: string;
    exchange: string;
    portfolio: string;
    type: 'Limit' | 'StopLimit' | 'Stop';
  }[],
  executionPolicy: ExecutionPolicy;
}

export interface OrdersGroup {
  id: string,
  orders: OrdersGroupItem[],
  executionPolicy: ExecutionPolicy,
  status: 'Active' | 'Canceled' | 'Filled'
}

export interface OrdersGroupItem {
  orderId: string;
}

export interface OrdersGroupTreeNode extends NzTreeNodeOptions {
  order?: Order | StopOrder;
  group?: {
    id: string;
    displayId: string;
    instruments: string;
    prices: string;
    qtys: string;
  };
  status?: 'Active' | 'Canceled' | 'Filled';
  children?: OrdersGroupTreeNode[]
}
