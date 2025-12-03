import {
  Order,
  StopOrder
} from "./order.model";
import { NzTreeNodeOptions } from "ng-zorro-antd/tree";

export enum ExecutionPolicy {
  OnExecuteOrCancel = 'OnExecuteOrCancel',
  IgnoreCancel = 'IgnoreCancel',
  TriggerBracketOrders = 'TriggerBracketOrders'
}

export interface CreateOrderGroupReq {
  orders: {
    orderId: string;
    exchange: string;
    portfolio: string;
    type: 'Limit' | 'Market' | 'Stop' | 'StopLimit';
  }[];
  executionPolicy: ExecutionPolicy;
}

export interface OrdersGroup {
  id: string;
  orders: OrdersGroupItem[];
  executionPolicy: ExecutionPolicy;
  status: 'Active' | 'Canceled' | 'Filled';
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
  children?: OrdersGroupTreeNode[];
}

export interface SubmitGroupResult {
  message: string;
  groupId: string;
}

export const GroupCreatedEventKey = 'OrdersGroupCreatedEvent';
