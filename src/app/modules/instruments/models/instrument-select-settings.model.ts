import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId } from "../../../shared/models/settings/table-settings.model";

export interface InstrumentSelectSettings extends WidgetSettings {
  activeListId?: string;
  instrumentColumns: string[];
}

export interface ColumnId extends BaseColumnId {
  tooltip: string,
  minWidth?: number | null
}

export const allInstrumentsColumns: ColumnId[] = [
  { id: 'symbol', displayName: "Тикер", tooltip: 'Биржевой идентификатор ценной бумаги', isDefault: true, minWidth: 55 },
  { id: 'shortName', displayName: "Назв.", tooltip: 'Название тикера', isDefault: true, minWidth: 60 },
  { id: 'price', displayName: "Цена", tooltip: 'Цена последней сделки', isDefault: true },
  { id: 'dayChange', displayName: "Д.изм.", tooltip: 'Изменение за день', isDefault: true },
  { id: 'dayChangePerPrice', displayName: "Д.изм.,%", tooltip: 'Изменение за день в %', isDefault: true },
  { id: 'maxPrice', displayName: "Д.макс.", tooltip: 'Максимальная цена за день', isDefault: false },
  { id: 'minPrice', displayName: "Д.мин.", tooltip: 'Минимальная цена за день', isDefault: false },
  { id: 'volume', displayName: "Объём", tooltip: 'Объём', isDefault: false },
  { id: 'openPrice', displayName: "Откр.", tooltip: 'Цена на начало дня', isDefault: false },
  { id: 'closePrice', displayName: "Закр.", tooltip: 'Цена на конец предыдущего дня', isDefault: false },
];
