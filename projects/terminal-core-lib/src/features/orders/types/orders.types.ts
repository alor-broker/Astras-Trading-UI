export enum OrderType {
  Market = 'market',
  Limit = 'limit',
  StopMarket = 'stop',
  StopLimit = 'stoplimit'
}

export enum TimeInForce {
  OneDay = 'oneday',
  ImmediateOrCancel = 'immediateorcancel',
  FillOrKill = 'fillorkill',
  AtTheClose = 'attheclose',
  GoodTillCancelled = 'goodtillcancelled'
}

