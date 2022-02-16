export interface HistoryRequest {
  code: string,
  exchange: string,
  tf?: string,
  from?: number,
  to: number,
  instrumentGroup?: string
}
