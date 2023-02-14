import { SubscriptionRequest } from '../services/subscriptions-data-feed.service';

export interface GetAllTradesRequest {
  exchange: string;
  symbol: string;
  from: number;
  to: number;
  take: number;
}

export interface AllTradesSubRequest extends SubscriptionRequest {
  code: string;
  format: string,
  exchange: string,
  depth?: number
}

export interface AllTradesItem {
  existing: boolean;
  id: number;
  oi: number;
  orderno: number;
  price: number;
  qty: number;
  side: string;
  symbol: string;
  time: string;
  timestamp: number;
}

export interface AllTradesFilters {
  limit?: number;
  offset?: number;
  descending?: boolean;
  orderBy?: string;
  exchange: string;
  symbol: string;
  from: number;
  to: number;
  take: number;
  qtyFrom?: number;
  qtyTo?: number;
  priceFrom?: number;
  priceTo?: number;
  side?: string;
}
