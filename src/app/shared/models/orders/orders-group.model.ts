export interface OrdersGroupRes {
  Id: string,
  Orders: OrdersGroupResItem[],
  ExecutionPolicy: 'OnExecuteOrCancel' | 'IgnoreCancel' | 'IgnoreCancelEditingSupport',
  Status: 'Active' | 'Canceled' | 'Filled'
}

export interface OrdersGroupResItem {
  Exchange: string;
  Portfolio: string;
  OrderId: string;
  Type: 'Limit' | 'StopLimit' | 'Stop';
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
