import { Side } from '../../../shared/models/enums/side.model';
import { OrderType } from "../../../shared/models/orders/order.model";

export interface CurrentOrder {
  orderId: string;
  exchange: string;
  portfolio: string;
  volume: number;
  price: number;
  type: OrderType;
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
