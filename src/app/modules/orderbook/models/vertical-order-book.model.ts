export interface OrderBookItem {
  price: number;
  volume?: number;
  // This model is expected to be extended with orders fields
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
  rowType: VerticalOrderBookRowType;
  isBest?: boolean;
}
