export interface CancelCommand {
  orderid: string,
  portfolio: string,
  exchange: string,
  stop: boolean
}
