import {InstrumentKey} from '../../../common/types/instrument.types';

export interface SingleOrderEvaluation {
  price: number;
  lotQuantity: number;
  instrument: InstrumentKey;
  portfolio: string;
  instrumentCurrency?: string;
}

export interface MultiOrderEvaluationItem {
  instrumentKey: InstrumentKey;
  budget: number;
  price?: number;
}

export interface EvaluationRequest {
  exchange: string;
  portfolio: string;
  ticker: string;
  price?: number;
  lotQuantity?: number;
  board?: string;

  budget: number;
  includeLimitOrders?: boolean;
}

export interface Evaluation {
  portfolio: string;
  ticker: string;
  exchange: string;
  quantityToSell: number;
  quantityToBuy: number;
  notMarginQuantityToSell: number;
  notMarginQuantityToBuy: number;
  orderEvaluation: number;
  commission: number;
  currency?: string;

  price?: number;
}
