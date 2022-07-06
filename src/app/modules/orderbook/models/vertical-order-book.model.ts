export interface OrderBookItem {
  price: number;
  volume?: number;
  yield?: number;
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

export interface VerticalOrderBookRowView extends OrderBookItem{
  displayValue: number;
  rowType: VerticalOrderBookRowType;
  isBest?: boolean;
}
