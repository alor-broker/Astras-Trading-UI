import { OrderbookRow } from "./orderbook-row.model";

export interface OrderBook {
  asks: OrderbookRow[],
  bids: OrderbookRow[]
}
