export interface HistoryRequest {
  symbol: string,
  exchange: string,
  tf?: string,
  from?: number,
  to: number,
  instrumentGroup?: string
}
