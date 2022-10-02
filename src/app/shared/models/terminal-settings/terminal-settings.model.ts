import { TimezoneDisplayOption } from '../enums/timezone-display-option';
import { ThemeType } from '../settings/theme-settings.model';

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
  buyBestAsk?: string;
  sellBestBid?: string;
}

export interface DesignSettings {
  theme?: ThemeType;
}

export interface TerminalSettings {
  timezoneDisplayOption?: TimezoneDisplayOption;
  userIdleDurationMin?: number;
  badgesBind?: boolean;
  hotKeysSettings?: HotKeysSettings;
  designSettings?: DesignSettings;
}
