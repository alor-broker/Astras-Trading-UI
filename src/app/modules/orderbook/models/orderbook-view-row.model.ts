import { Side } from '../../../shared/models/enums/side.model';

export interface CurrentOrder {
  orderId: string;
  exchange: string;
  portfolio: string;
  volume: number;
  price: number;
  type: string;
  side: Side;
  symbol: string;
}

export interface OrderBookViewRow {
  bidVolume?: number;
  bid?: number;
  yieldBid?: number;
  yieldAsk?: number;
  ask?: number;
  askVolume?: number;
  askOrderVolume?: number;
  bidOrderVolume?: number;

  askOrders: CurrentOrder[];
  bidOrders: CurrentOrder[];
}
