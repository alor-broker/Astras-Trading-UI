import { SubscriptionRequest } from '../services/subscriptions-data-feed.service';

export interface AllTradesSubRequest extends SubscriptionRequest {
  code: string;
  exchange: string;
  instrumentGroup?: string;
  format: string;
  depth?: number;
}

export interface AllTradesItem {
  existing: boolean;
  id: number;
  oi: number;
  orderNo: number;
  price: number;
  qty: number;
  side: string;
  symbol: string;
  time: string;
  timestamp: number;
}

export interface AllTradesFilters {
  qtyFrom?: number;
  qtyTo?: number;
  priceFrom?: number;
  priceTo?: number;
  side?: string;
}

export interface AllTradesPagination {
  limit?: number;
  offset?: number;
  from: number;
  to: number;
  take: number;
}

export interface AllTradesSort {
  descending: boolean;
  orderBy?: string;
}
