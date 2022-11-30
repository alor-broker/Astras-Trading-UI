export enum OrderType {
  LimitOrder = 'limitOrder',
  MarketOrder = 'marketOrder',
  StopOrder = 'stopOrder'
}

export type OrderFormUpdate<T> = Partial<T> & { target?: OrderType } | null;
