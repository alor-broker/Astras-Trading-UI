export interface RisksInfo {
  portfolio: string;
  ticker: string;
  exchange: string;
  isMarginal: boolean;
  isShortSellPossible: boolean;
  longMultiplier: number;
  shortMultiplier: number;
  currencyLongMultiplier: number;
  currencyShortMultiplier: number;
}
