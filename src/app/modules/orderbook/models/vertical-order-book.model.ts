export interface CurrentOrder {
  orderId: string;
  exchange: string;
  portfolio: string;
  volume: number;
}

export interface OrderBookItem {
  price: number;
  volume?: number;
  currentOrders: CurrentOrder[];
}

export interface VerticalOrderBook {
  asks: OrderBookItem[];
  bids: OrderBookItem[];
}

export enum VerticalOrderBookRowType {
  Ask,
  Bid,
  Spread
}

export interface VerticalOrderBookRowView extends OrderBookItem {
  rowType: VerticalOrderBookRowType;
  isBest?: boolean;
}
