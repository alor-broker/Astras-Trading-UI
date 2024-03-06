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
  format: string;
  exchange: string;
  depth?: number;
}

export interface AllTradesItem {
  existing: boolean;
  id: string;
  oi: number;
  orderno: number;
  price: number;
  qty: number;
  side: string;
  symbol: string;
  time: string;
  timestamp: number;
}

export interface AllTradesReqFilters extends AllTradesPagination, AllTradesFilters {
  descending?: boolean;
  orderBy?: string;
}

export interface AllTradesFilters {
  exchange: string;
  symbol: string;
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
