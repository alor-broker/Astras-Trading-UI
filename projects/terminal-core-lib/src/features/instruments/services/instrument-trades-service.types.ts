import {SubscriptionRequest} from '../../data-subscriptions/services/subscriptions-data-feed.service';

export interface InstrumentTradesSubRequest extends SubscriptionRequest {
  code: string;
  exchange: string;
  instrumentGroup?: string;
  format: string;
  depth?: number;
}

export interface InstrumentTradesItem {
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

export interface InstrumentTradesFilters {
  qtyFrom?: number;
  qtyTo?: number;
  priceFrom?: number;
  priceTo?: number;
  side?: string;
}

export interface InstrumentTradesPagination {
  limit?: number;
  offset?: number;
  from: number;
  to: number;
  take: number;
}

export interface InstrumentTradesSort {
  descending: boolean;
  orderBy?: string;
}
