import { SubscriptionRequest } from '../../../shared/services/subscriptions-data-feed.service';

export interface BarsRequest extends SubscriptionRequest {
  code: string; // "SBER",
  tf: string; // 60, D
  from: number; // 1629648038,
  instrumentGroup?: string | null; // TQBR or SMAL
  exchange: string;
  format: string;
}
