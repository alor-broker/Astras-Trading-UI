import { EvaluationBaseProperties } from "./evaluation-base-properties.model";

export interface EvaluationRequest{
  exchange: string,
  portfolio: string,
  ticker: string,
  price: number,
  lotQuantity: number,
  currency: string,
  board?: string
}
