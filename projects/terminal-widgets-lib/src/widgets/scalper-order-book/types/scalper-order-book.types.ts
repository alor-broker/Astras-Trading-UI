import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {OrderType} from '@terminal-core-lib/features/orders/types/orders.types';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {Condition} from '@terminal-core-lib/common/types/condition.types';
import {OrderMeta} from '@terminal-core-lib/features/orders/types/new-order.types';
import {Range} from '@terminal-core-lib/common/types/range.types'


export interface CurrentOrderDisplay {
  orderId: string;
  targetInstrument: InstrumentKey;
  ownedPortfolio: PortfolioKey;
  type: OrderType;

  side: Side;
  price?: number;
  triggerPrice?: number;
  displayVolume: number;
  condition?: Condition;
  meta?: OrderMeta;
  isDirty: boolean;
}

export type LocalOrder = Omit<CurrentOrderDisplay, 'meta'>;

export interface PriceRow {
  price: number;
  isStartRow: boolean;
  baseRange: Range;
}

export enum ScalperOrderBookRowType {
  Ask = 'ask',
  Bid = 'bid',
  Mixed = 'mixed',
  Spread = 'spread'
}

export interface BodyRow extends PriceRow {
  volume?: number | null;
  growingVolume?: number | null;
  askVolume?: number | null;
  bidVolume?: number | null;

  isBest?: boolean | null;

  rowType?: ScalperOrderBookRowType | null;

  isFiller: boolean;

  isMinorLinePrice: boolean;
  isMajorLinePrice: boolean;

  currentPositionRangeSign: number | null;
}

export interface ScalperOrderBookPositionState {
  price?: number;
  qty: number;
  lossOrProfitPoints?: number;
  lossOrProfitPercent?: number;
}
