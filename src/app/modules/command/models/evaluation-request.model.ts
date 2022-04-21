export interface EvaluationRequest{
  exchange: string,
  portfolio: string,
  ticker: string,
  price: number,
  lotQuantity: number,
  currency: string,
  board?: string
}
