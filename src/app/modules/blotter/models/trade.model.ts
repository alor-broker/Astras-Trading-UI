import { Trade } from "../../../shared/models/trades/trade.model";

export interface TradeFilter {
  id?: string;
  orderno?: string;
  symbol?: string;
  [key: string]: string | string[] | undefined;
}

export interface DisplayTrade extends Trade {
  volume: number;
}
