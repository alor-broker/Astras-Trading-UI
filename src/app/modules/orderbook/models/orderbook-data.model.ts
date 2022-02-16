import { OrderbookDataRow } from "./orderbook-data-row.model";

export interface OrderbookData {
  asks: OrderbookDataRow[],
  bids: OrderbookDataRow[]
}
