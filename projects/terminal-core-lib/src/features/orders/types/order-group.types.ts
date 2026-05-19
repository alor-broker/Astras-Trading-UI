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

export interface SubmitGroupResult {
  message: string;
  groupId: string;
}

export const GroupCreatedEventKey = 'OrdersGroupCreatedEvent';
