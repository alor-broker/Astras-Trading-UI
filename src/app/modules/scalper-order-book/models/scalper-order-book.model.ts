import { Side } from '../../../shared/models/enums/side.model';
import { Range } from "../../../shared/models/common.model";
import { LessMore } from "../../../shared/models/enums/less-more.model";
import { OrderType } from "../../../shared/models/orders/order.model";
import { OrderMeta } from "../../../shared/models/orders/new-order.model";

export interface CurrentOrderDisplay {
  orderId: string;
  symbol: string;
  exchange: string;
  portfolio: string;
  type: OrderType;

  side: Side;
  price?: number;
  triggerPrice?: number;
  displayVolume: number;
  condition?: LessMore;
  meta?: OrderMeta;
  isDirty: boolean;
}

export interface LocalOrder extends Omit<CurrentOrderDisplay, 'meta'> {
  instrumentGroup?: string | null;
}

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
