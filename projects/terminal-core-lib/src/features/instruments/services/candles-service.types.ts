import {SubscriptionRequest} from '../../data-subscriptions/services/subscriptions-data-feed.service';

export interface Candle {
  time: number; // 1640174400000,
  close: number; // 295.3,
  open: number; // 294.87,
  high: number; // 295.6,
  low: number; // 294.5,
  volume: number; // 155874
}

export interface HistoryRequest {
  symbol: string;
  exchange: string;
  tf: string;
  from: number;
  to: number;
  countBack?: number;
}

export interface HistoryResponse {
  history: Candle[];
  prev: number;
  next: number;
}

export interface CandleRequest extends SubscriptionRequest {
  code: string; // "SBER",
  tf: string; // 60, D
  from: number; // 1629648038,
  instrumentGroup?: string | null; // TQBR or SMAL
  exchange: string;
  format: string;
}
