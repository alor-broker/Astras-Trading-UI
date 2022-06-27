import { OrderbookDataRow } from "./orderbook-data-row.model";

export interface OrderbookData {
  /**
   * asks
   */
  a: OrderbookDataRow[],
  /**
   * bids
   */
  b: OrderbookDataRow[]
}
