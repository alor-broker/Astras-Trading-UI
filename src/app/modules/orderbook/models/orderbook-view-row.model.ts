import { CurrentOrder } from './scalper-order-book.model';

export interface OrderBookViewRow {
  bidVolume?: number,
  bid?: number,
  yieldBid?: number,
  yieldAsk?: number,
  ask?: number,
  askVolume?: number,
  askOrderVolume?: number,
  bidOrderVolume?: number,

  askOrders: CurrentOrder[],
  bidOrders: CurrentOrder[]
}
