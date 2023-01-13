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

export enum ScalperOrderBookRowType {
  Ask = 'ask',
  Bid = 'bid',
  Spread = 'spread'
}

export interface ScalperOrderBookRow {
  price: number;
  volume?: number | null;
  rowType?: ScalperOrderBookRowType | null;
  isBest?: boolean | null
  getVolumeStyle?: (() => { [key: string]: any; } | null) | null;
  currentOrders?: CurrentOrder[] | null;
  isStartRow: boolean;
  isFiller: boolean;
  currentPositionRangeSign: number | null;
}

export interface ScalperOrderBookPositionState {
  price: number;
  qty: number;
  lossOrProfit: number;
}

