import { WidgetSettings } from "../widget-settings.model";

export interface InstrumentSelectSettings extends WidgetSettings {
  activeListId?: string;
  instrumentColumns: string[];
}

export interface ColumnIds  {
  columnId: string,
  name: string,
  isDefault: boolean,
  tooltip: string,
  minWidth?: number | null
}

export const allInstrumentsColumns: ColumnIds[] = [
  { columnId: 'symbol', name: "Тикер", tooltip: 'Биржевой идентификатор ценной бумаги', isDefault: true, minWidth: 55 },
  { columnId: 'shortName', name: "Назв.", tooltip: 'Название тикера', isDefault: true, minWidth: 60 },
  { columnId: 'price', name: "Цена", tooltip: 'Цена последней сделки', isDefault: true },
  { columnId: 'dayChange', name: "Д.изм.", tooltip: 'Изменение за день', isDefault: true },
  { columnId: 'dayChangePerPrice', name: "Д.изм.,%", tooltip: 'Изменение за день в %', isDefault: true },
  { columnId: 'maxPrice', name: "Д.макс.", tooltip: 'Максимальная цена за день', isDefault: false },
  { columnId: 'minPrice', name: "Д.мин.", tooltip: 'Минимальная цена за день', isDefault: false },
  { columnId: 'volume', name: "Объём", tooltip: 'Объём', isDefault: false },
  { columnId: 'openPrice', name: "Откр.", tooltip: 'Цена на начало дня', isDefault: false },
  { columnId: 'closePrice', name: "Закр.", tooltip: 'Цена на конец предыдущего дня', isDefault: false },
];
