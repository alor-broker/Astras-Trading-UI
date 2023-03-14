import { TimezoneDisplayOption } from '../enums/timezone-display-option';
import { ThemeType } from '../settings/theme-settings.model';
import { PortfolioKey } from "../portfolio-key.model";

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

export interface PortfolioCurrency {
  portfolio: PortfolioKey;
  currency: string;
}

export enum OrdersInstantNotificationType {
  OrderCreated = 'orderCreated',
  OrderSubmitFailed = 'orderSubmitFailed',
  OrderFilled = 'orderFilled',
  OrderPartiallyFilled = 'orderPartiallyFilled',
  OrderStatusChanged = 'orderStatusChanged',
  OrderCancelled = 'orderCancelled',
  OrderUpdated = 'orderUpdated',
  OrderUpdateFailed = 'orderUpdateFailed'
}

export enum CommonInstantNotificationType {
  Common = 'common'
}

export type InstantNotificationType = CommonInstantNotificationType | OrdersInstantNotificationType;

export interface InstantNotificationsSettings {
  hiddenNotifications?: InstantNotificationType[]
}


export interface TerminalSettings {
  timezoneDisplayOption?: TimezoneDisplayOption;
  userIdleDurationMin?: number;
  language?: 'en' | 'ru' | null;
  badgesBind?: boolean;
  hotKeysSettings?: HotKeysSettings;
  designSettings?: DesignSettings;
  portfoliosCurrency?: PortfolioCurrency[];
  instantNotificationsSettings?: InstantNotificationsSettings;
  excludedSettings?: string[];
}

