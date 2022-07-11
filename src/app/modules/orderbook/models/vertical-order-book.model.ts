export interface CurrentOrder {
  orderId: string;
  exchange: string;
  portfolio: string;
  volume: number;
}

export interface OrderBookItem {
  price: number;
  volume?: number;
  yield?: number;
  currentOrders: CurrentOrder[];
}

export interface VerticalOrderBook {
  asks: OrderBookItem[];
  bids: OrderBookItem[];
  spreadItems: OrderBookItem[];
}

export enum VerticalOrderBookRowType {
  Ask,
  Bid,
  Spread
}

export interface VerticalOrderBookRowView extends OrderBookItem {
  displayValue: number;
  rowType: VerticalOrderBookRowType;
  isBest?: boolean;
  getVolumeStyle : () => { [key: string]: any; } | null;
}
