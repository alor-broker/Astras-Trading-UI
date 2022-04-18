export interface Evaluation {
  portfolio: string;
  ticker: string;
  exchange: string;
  quantityToSell: number;
  quantityToBuy: number;
  orderEvaluation: number;
  commission: number;
}
