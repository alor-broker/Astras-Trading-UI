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
