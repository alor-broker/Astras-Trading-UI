export enum TradePlanLevel {
  CurrentPrice = 'currentPrice',
  EntryPrice = 'entryPrice',
  StopLoss = 'stopLoss',
  TakeProfit1 = 'takeProfit1',
  TakeProfit2 = 'takeProfit2'
}

export interface TradePlanValue {
  labelKey: TradePlanLevel;
  tooltipKey: string;
  value: number | null;
}
