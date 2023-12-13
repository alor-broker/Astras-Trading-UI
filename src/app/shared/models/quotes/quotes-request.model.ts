import { SubscriptionRequest } from '../../services/subscriptions-data-feed.service';

export interface QuotesRequest extends SubscriptionRequest {
  code: string;
  exchange: string;
  instrumentGroup?: string | null;
  format: string;
}
