import { OrderbookRow } from "./orderbook-row.model";
import { OrderBookViewRow } from "./orderbook-view-row.model";

export interface OrderBook {
  rows: Array<OrderBookViewRow>,
  maxVolume: number
}
