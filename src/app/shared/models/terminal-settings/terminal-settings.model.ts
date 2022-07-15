import { TimezoneDisplayOption } from '../enums/timezone-display-option';

export interface HotKeysSettings {
  cancelOrdersKey?: string;
  closePositionsKey?: string;
  centerOrderbookKey?: string;
  cancelOrderbookOrders?: string;
  closeOrderbookPositions?: string;
  reverseOrderbookPositions?: string;
  buyMarket?: string;
  sellMarket?: string;
  workingVolumes?: string[];
  sellBestOrder?: string;
  buyBestOrder?: string;
}

export interface TerminalSettings {
  timezoneDisplayOption?: TimezoneDisplayOption;
  userIdleDurationMin?: number;
  hotKeysSettings?: HotKeysSettings;
}
