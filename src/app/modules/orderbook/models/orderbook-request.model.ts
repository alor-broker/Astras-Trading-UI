import { SubscriptionRequest } from '../../../shared/services/subscriptions-data-feed.service';

export interface OrderbookRequest extends SubscriptionRequest {
  code: string,
  exchange: string,
  instrumentGroup?: string
  depth: number,
  format: string
}
