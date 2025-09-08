import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { MarketType } from '../../../shared/models/portfolio-key.model';
import { BaseColumnId, TableDisplaySettings } from '../../../shared/models/settings/table-settings.model';

export interface BlotterSettings extends WidgetSettings {
  activeTabIndex: number;
  exchange: string;
  portfolio: string;
  marketType?: MarketType;
  ordersTable?: TableDisplaySettings;
  stopOrdersTable?: TableDisplaySettings;
  tradesTable?: TableDisplaySettings;
  tradesHistoryTable?: TableDisplaySettings;
  repoTradesTable?: TableDisplaySettings;
  positionsTable?: TableDisplaySettings;
  notificationsTable?: TableDisplaySettings;
  isSoldPositionsHidden: boolean;
  cancelOrdersWithoutConfirmation?: boolean;
  showSummary?: boolean;
  showOrders?: boolean;
  showStopOrders?: boolean;
  showPositions?: boolean;
  showTrades?: boolean;
  showRepoTrades?: boolean;
  showHistoryTrades?: boolean;
  showNotifications?: boolean;
  showPositionActions?: boolean;

  /**
   * @deprecated use ordersTable
   */
  ordersColumns?: string[];
  /**
   * @deprecated use stopOrdersTable
   */
  stopOrdersColumns?: string[];
  /**
   * @deprecated use positionsTable
   */
  positionsColumns?: string[];
  /**
   * @deprecated use tradesTable
   */
  tradesColumns?: string[];
}

export const allOrdersColumns: BaseColumnId[] = [
  { id: 'id', displayName: "Номер", isDefault: false },
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'side', displayName: "Сторона", isDefault: false },
  { id: 'status', displayName: "Статус", isDefault: true },
  { id: 'qty', displayName: "Кол-во", isDefault: false },
  { id: 'residue', displayName: "Остаток", isDefault: true },
  { id: 'volume', displayName: "Объем", isDefault: true },
  { id: 'price', displayName: "Цена", isDefault: true },
  { id: 'transTime', displayName: 'Время', isDefault: true },
  { id: 'exchange', displayName: "Биржа", isDefault: false },
  { id: 'type', displayName: "Тип", isDefault: false },
  { id: 'endTime', displayName: "Действ. до", isDefault: false },
];

export const allStopOrdersColumns: BaseColumnId[] = [
  ...allOrdersColumns,
  { id: 'triggerPrice', displayName: "Сигнальная цена", isDefault: true },
  { id: 'conditionType', displayName: "Условие", isDefault: true },
];

export const allPositionsColumns: BaseColumnId[] = [
  { id: 'icon', displayName: "Значок", isDefault: true },
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Имя", isDefault: true },
  { id: 'avgPrice', displayName: "Средняя", isDefault: true },
  { id: 'shareOfPortfolio', displayName: "Доля, %", isDefault: false },
  { id: 'qtyT0', displayName: "T0", isDefault: false },
  { id: 'qtyT1', displayName: "T1", isDefault: false },
  { id: 'qtyT2', displayName: "T2", isDefault: true },
  { id: 'qtyTFuture', displayName: "TFuture", isDefault: false },
  { id: 'volume', displayName: "Ср. объём", isDefault: false },
  { id: 'currentVolume', displayName: "тек. объём", isDefault: false },
  { id: 'unrealisedPl', displayName: "P/L всего", isDefault: true },
  { id: 'dailyUnrealisedPl', displayName: "P/L дн.", isDefault: false },
  { id: 'unrealisedPlRatio', displayName: "P/L всего, %", isDefault: true },
  { id: 'dailyUnrealisedPlRatio', displayName: "P/L дн., %", isDefault: false },
];

export const allTradesColumns: BaseColumnId[] = [
  { id: 'id', displayName: "Номер", isDefault: false },
  { id: 'orderNo', displayName: "Заявка", isDefault: false },
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Название", isDefault: true },
  { id: 'side', displayName: "Сторона", isDefault: false },
  { id: 'price', displayName: "Цена", isDefault: true },
  { id: 'qty', displayName: "Кол-во", isDefault: true },
  { id: 'date', displayName: 'Время', isDefault: false },
  { id: 'volume', displayName: 'Объем', isDefault: false }
];

export const allTradesHistoryColumns: BaseColumnId[] = [
  { id: 'id', displayName: "Номер", isDefault: false },
  { id: 'orderNo', displayName: "Заявка", isDefault: false },
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Название", isDefault: true },
  { id: 'side', displayName: "Сторона", isDefault: true },
  { id: 'price', displayName: "Цена", isDefault: true },
  { id: 'qty', displayName: "Кол-во", isDefault: true },
  { id: 'date', displayName: 'Время', isDefault: true },
  { id: 'volume', displayName: 'Объем', isDefault: false }
];

export const allNotificationsColumns: BaseColumnId[] = [
  { id: 'id', displayName: "id", isDefault: false },
  { id: 'subscriptionType', displayName: "subscriptionType", isDefault: true },
  { id: 'instrument', displayName: "instrument", isDefault: true },
  { id: 'priceCondition', displayName: "priceCondition", isDefault: true },
  { id: 'price', displayName: "price", isDefault: true },
];

export const allRepoTradesColumns: BaseColumnId[] = [
  ...allTradesColumns.filter(c => c.id !== 'volume'),
  { id: 'value', displayName: "Объем", isDefault: true },
  { id: 'repoRate', displayName: "% годовых", isDefault: true },
  { id: 'extRef', displayName: "Пользователь внеш. системы", isDefault: false },
  { id: 'repoTerm', displayName: "Срок", isDefault: true },
  { id: 'account', displayName: "Торговый счёт", isDefault: false },
  { id: 'tradeTypeInfo', displayName: 'Тип', isDefault: true },
  { id: 'yield', displayName: 'Доход', isDefault: true }
];

export enum TableNames {
  OrdersTable = 'ordersTable',
  StopOrdersTable = 'stopOrdersTable',
  TradesTable = 'tradesTable',
  TradesHistoryTable = 'tradesHistoryTable',
  RepoTradesTable = 'repoTradesTable',
  PositionsTable = 'positionsTable',
  NotificationsTable = 'notificationsTable'
}

export enum ColumnsNames {
  OrdersColumns = 'ordersColumns',
  StopOrdersColumns = 'stopOrdersColumns',
  PositionsColumns = 'positionsColumns',
  TradesColumns = 'tradesColumns'
}
