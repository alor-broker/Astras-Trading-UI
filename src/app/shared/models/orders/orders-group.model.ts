import { NzTreeNodeOptions } from "ng-zorro-antd/core/tree/nz-tree-base-node";
import { Order } from "./order.model";
import { StopOrder } from "./stop-order.model";

export interface CreateOrderGroupReq {
  orders: {
    orderId: string;
    exchange: string;
    portfolio: string;
    type: 'Limit' | 'StopLimit' | 'Stop';
  }[],
  ExecutionPolicy: string;
}

export interface OrdersGroup {
  id: string,
  orders: OrdersGroupItem[],
  executionPolicy: 'OnExecuteOrCancel' | 'IgnoreCancel' | 'IgnoreCancelEditingSupport',
  status: 'Active' | 'Canceled' | 'Filled'
}

export interface OrdersGroupItem {
  exchange: string;
  portfolio: string;
  orderId: string;
  type: 'Limit' | 'StopLimit' | 'Stop';
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
