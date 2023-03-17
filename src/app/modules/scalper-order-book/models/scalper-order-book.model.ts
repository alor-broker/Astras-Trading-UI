import { Side } from '../../../shared/models/enums/side.model';

export interface CurrentOrderDisplay {
  orderId: string;
  symbol: string;
  exchange: string;
  portfolio: string;
  type: 'limit' | 'stoplimit' | 'stop';

  side: Side;
  linkedPrice: number;
  displayVolume: number;
}

export interface PriceRow {
  price: number;
  isStartRow: boolean;
}

export enum ScalperOrderBookRowType {
  Ask = 'ask',
  Bid = 'bid',
  Spread = 'spread'
}

export interface BodyRow extends PriceRow {
  volume?: number | null;
  isBest?: boolean | null;

  rowType?: ScalperOrderBookRowType | null;

  isFiller: boolean;

  currentPositionRangeSign: number | null;
}

export interface ScalperOrderBookPositionState {
  price: number;
  qty: number;
  lossOrProfitPoints: number;
  lossOrProfitPercent: number;
}

