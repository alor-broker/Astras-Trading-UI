export enum OrderType {
  LimitOrder = 'limitOrder',
  MarketOrder = 'marketOrder',
  StopOrder = 'stopOrder'
}

export type OrderFormUpdate<T> = Partial<T> & { target?: OrderType } | null;

export interface OrderFormValue<T> {
  value: T;
  isValid: boolean;
}
