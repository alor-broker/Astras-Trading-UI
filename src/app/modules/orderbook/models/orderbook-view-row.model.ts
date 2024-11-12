import { Side } from '../../../shared/models/enums/side.model';
import { OrderType } from "../../../shared/models/orders/order.model";
import {PortfolioKey} from "../../../shared/models/portfolio-key.model";
import {InstrumentKey} from "../../../shared/models/instruments/instrument-key.model";

export interface CurrentOrder {
  orderId: string;
  ownedPortfolio: PortfolioKey;
  targetInstrument: InstrumentKey;
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
