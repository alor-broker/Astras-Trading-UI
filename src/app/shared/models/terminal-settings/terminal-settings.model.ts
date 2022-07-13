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
  selectWorkingVolume1?: string;
  selectWorkingVolume2?: string;
  selectWorkingVolume3?: string;
  selectWorkingVolume4?: string;
  sellBestOrder?: string;
  buyBestOrder?: string;
}
