import { SubscriptionRequest } from '../../../shared/services/subscriptions-data-feed.service';

export interface OrderbookRequest extends SubscriptionRequest {
  code: string;
  exchange: string;
  instrumentGroup?: string | null;
  depth: number;
  format: string;
}

export interface OrderbookDataRow {
  /**
   * Volume
   */
  v: number;
  /**
   * price
   */
  p: number;
  /**
   * bond yield
   */
  y: number;
}

export interface OrderbookData {
  /**
   * asks
   */
  a: OrderbookDataRow[];
  /**
   * bids
   */
  b: OrderbookDataRow[];
}
