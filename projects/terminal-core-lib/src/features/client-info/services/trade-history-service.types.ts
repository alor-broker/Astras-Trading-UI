export interface TradeFilter {
  id?: string;
  orderNo?: string;
  symbol?: string;
  side?: 'buy' | 'sell';

  [key: string]: string | string[] | undefined;
}
