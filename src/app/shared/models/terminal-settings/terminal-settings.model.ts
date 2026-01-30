import { TimezoneDisplayOption } from '../enums/timezone-display-option';
import { ThemeType } from '../settings/theme-settings.model';
import { PortfolioKey } from "../portfolio-key.model";
import { TableRowHeight } from "../enums/table-row-height";

export interface HotKeyMeta {
  key: string;
  code: string;
  shiftKey?: boolean;
  ctrlKey?: boolean;
  altKey?: boolean;
}

// only deprecated format has type 'string'
// all new hotkeys must have type 'HotKeyMeta'
export type DeprecatedHotKey = HotKeyMeta | string;

export enum AllOrderBooksHotKeysTypes {
  cancelOrdersAll = 'cancelOrdersAll',
  cancelOrdersAndClosePositionsByMarketAll = 'cancelOrdersAndClosePositionsByMarketAll',
  cancelOrdersKey = 'cancelOrdersKey',
  closePositionsKey = 'closePositionsKey',
  centerOrderbookKey = 'centerOrderbookKey'
}

export enum ActiveOrderBookHotKeysTypes {
  cancelOrderbookOrders = 'cancelOrderbookOrders',
  cancelStopOrdersCurrent = 'cancelStopOrdersCurrent',
  closeOrderbookPositions = 'closeOrderbookPositions',
  reverseOrderbookPositions = 'reverseOrderbookPositions',
  buyMarket = 'buyMarket',
  sellMarket = 'sellMarket',
  sellBestOrder = 'sellBestOrder',
  buyBestOrder = 'buyBestOrder',
  buyBestAsk = 'buyBestAsk',
  sellBestBid = 'sellBestBid',
  increaseScale = 'increaseScale',
  decreaseScale = 'decreaseScale',
  toggleGrowingVolumeDisplay = 'toggleGrowingVolumeDisplay',
}

export type AllOrderBookHotKeyTypes = AllOrderBooksHotKeysTypes | ActiveOrderBookHotKeysTypes;

export type HotKeysMap = Partial<Record<AllOrderBookHotKeyTypes, DeprecatedHotKey>>;

export interface HotKeysSettings extends HotKeysMap {
  workingVolumes?: string[];
  extraHotKeys?: boolean;
}

export enum ScalperOrderBookMouseAction {
  LimitBuyOrder = 'limitBuyOrder',
  LimitSellOrder = 'limitSellOrder',
  MarketBuyOrder = 'marketBuyOrder',
  MarketSellOrder = 'marketSellOrder',
  StopLimitBuyOrder = 'stopLimitBuyOrder',
  StopLimitSellOrder = 'stopLimitSellOrder',
  StopLossOrder = 'stopLossOrder'
}

export interface ScalperOrderBookMouseActionsMapItem {
  button: 'left' | 'right';

  orderBookRowType: 'ask' | 'bid' | 'spread' | 'any';

  modifier?: 'shift' | 'ctrl' | null;
  action: ScalperOrderBookMouseAction;
}

export enum MouseActionsSchemes {
  Scheme1 = 'scheme1',
  Scheme2 = 'scheme2'
}

export interface ScalperOrderBookMouseActionsMap {
  mapName: MouseActionsSchemes;
  actions: ScalperOrderBookMouseActionsMapItem[];
}

export enum GridType {
  Fit = 'fit',
  VerticalFixed = 'verticalFixed',
  HorizontalFixed = 'horizontalFixed'
}

export enum FontFamilies {
  NotoSans = 'Noto Sans',
  Roboto = 'Roboto',
  OpenSans = 'Open Sans',
  SourceSans3 = 'Source Sans 3',
  NotoSerif = 'Noto Serif',
  Caveat = 'Caveat'
}

export interface DesignSettings {
  theme?: ThemeType;
  gridType?: GridType;
  fontFamily?: FontFamilies;
}

export interface PortfolioCurrencySettings {
  portfolio: PortfolioKey;
  currency: string;
}

export enum OrdersInstantNotificationType {
  OrderCreated = 'orderCreated',
  OrderSubmitFailed = 'orderSubmitFailed',
  OrderFilled = 'orderFilled',
  OrderPartiallyFilled = 'orderPartiallyFilled',
  OrderStatusChanged = 'orderStatusChanged',
  OrderStatusChangeToCancelled = 'OrderStatusChangeToCancelled',
  OrderCancelled = 'orderCancelled',
  OrderCancelFailed = 'orderCancelFailed',
  OrderUpdated = 'orderUpdated',
  OrderUpdateFailed = 'orderUpdateFailed',
  OrdersGroupCreated = 'ordersGroupCreated',
  OrdersGroupUnsupported = 'ordersGroupUnsupported'
}

export enum CommonInstantNotificationType {
  Common = 'common'
}

export enum SessionInstantNotificationType {
  EndOfSession = 'endOfSession'
}

export enum ScalperOrderBookInstantNotificationType {
  EmptyPositions = 'emptyPositions'
}

export type InstantNotificationType = CommonInstantNotificationType |
  OrdersInstantNotificationType |
  SessionInstantNotificationType |
  ScalperOrderBookInstantNotificationType;

export interface InstantNotificationsSettings {
  hiddenNotifications?: InstantNotificationType[];
  hiddenPortfoliosForNotifications?: PortfolioKey[];
}

export type TerminalLanguage = 'en' | 'ru' | 'hy';

export interface QuickAccessPanelWidget {
  widgetType: string;
  selectedByDefault?: boolean;
  isPreferredOrderWidget?: boolean;
}

export interface MobileDashboardLayout {
  quickAccessPanelWidgets: QuickAccessPanelWidget[];
}

export interface TerminalSettings {
  timezoneDisplayOption?: TimezoneDisplayOption;
  isLogoutOnUserIdle?: boolean;
  userIdleDurationMin?: number;
  language?: TerminalLanguage | null;
  tableRowHeight?: TableRowHeight;
  badgesBind?: boolean;
  hotKeysSettings?: HotKeysSettings;
  scalperOrderBookMouseActions?: ScalperOrderBookMouseActionsMap;
  designSettings?: DesignSettings;
  portfoliosCurrency?: PortfolioCurrencySettings[];
  instantNotificationsSettings?: InstantNotificationsSettings;
  badgesColors?: string[];
  showCurrentTime?: boolean;
  mobileDashboardLayout?: MobileDashboardLayout;
}
