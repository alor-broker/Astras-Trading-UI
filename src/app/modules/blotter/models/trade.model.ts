import { Trade } from "../../../shared/models/trades/trade.model";

export interface TradeFilter {
  id?: string;
  orderNo?: string;
  symbol?: string;
  side?: 'buy' | 'sell';
  [key: string]: string | string[] | undefined;
}

export interface DisplayTrade extends Trade {
  volume: number;
  displayDate: Date;
}
