export interface CurrentOrder {
  orderId: string;
  exchange: string;
  portfolio: string;
  volume: number;
  type: string;
}

export interface OrderBookItem {
  price: number;
  volume?: number;
  yield?: number;
  currentOrders: CurrentOrder[];
}

export interface ScalperOrderBook {
  asks: OrderBookItem[];
  bids: OrderBookItem[];
  spreadItems: OrderBookItem[];
}

export enum ScalperOrderBookRowType {
  Ask,
  Bid,
  Spread
}

export interface ScalperOrderBookRowView extends OrderBookItem {
  displayValue: number;
  rowType: ScalperOrderBookRowType;
  isBest?: boolean;
  getVolumeStyle: () => { [key: string]: any; } | null;
}
