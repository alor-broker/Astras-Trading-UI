import { Candle } from "./candle.model";

export interface HistoryResponse {
  history: Candle[],
  prev: number,
  next: number
}
