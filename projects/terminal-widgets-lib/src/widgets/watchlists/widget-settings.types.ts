import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';

export interface WatchlistMeta {
  id: string;
  isExpanded: boolean;
}

export interface WatchlistsWidgetSettings extends WidgetSettings {
  activeWatchlistMetas?: WatchlistMeta[];
  showFavorites?: boolean;
  priceChangeTimeframe?: TimeframeValue;
  instrumentTable: TableDisplaySettings;

  /**
   * @deprecated use instrumentTable
   */
  instrumentColumns: string[];
}

export const watchlistColumns: BaseColumnId[] = [
  {id: 'symbol', displayName: "Тикер", isDefault: true},
  {id: 'shortName', displayName: "Назв.", isDefault: true},
  {id: 'price', displayName: "Цена", isDefault: true},
  {id: 'priceChange', displayName: "Изм. цены", isDefault: true},
  {id: 'priceChangeRatio', displayName: "Изм. цены, %", isDefault: true},
  {id: 'maxPrice', displayName: "Д.макс.", isDefault: false},
  {id: 'minPrice', displayName: "Д.мин.", isDefault: false},
  {id: 'volume', displayName: "Объём", isDefault: false},
  {id: 'openPrice', displayName: "Откр.", isDefault: false},
  {id: 'closePrice', displayName: "Закр.", isDefault: false}
];
