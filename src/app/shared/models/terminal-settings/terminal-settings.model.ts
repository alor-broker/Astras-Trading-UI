import { TimezoneDisplayOption } from '../enums/timezone-display-option';

export interface TerminalSettings {
  timezoneDisplayOption?: TimezoneDisplayOption
  userIdleDurationMin?: number;
  cancelOrdersKey?: string;
  closePositionsKey?: string;
  centerOrderbookKey?: string;
  cancelOrderbookOrders?: string;
  closeOrderbookPositions?: string;
  reverseOrderbookPositions?: string;
  buyMarket?: string;
  sellMarket?: string;
}
