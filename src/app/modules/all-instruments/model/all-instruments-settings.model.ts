import { WidgetSettings } from '../../../shared/models/widget-settings.model';

export interface AllInstrumentsSettings extends WidgetSettings {
  allInstrumentsColumns: string[];
}

export interface ColumnIds {
  columnId: string,
  name: string,
  isDefault: boolean
}

export const allInstrumentsColumns: ColumnIds[] = [
  { columnId: 'name', name: "Тикер", isDefault: true },
  { columnId: 'shortName', name: "Название", isDefault: true },
  { columnId: 'dailyGrowth', name: "Рост за сегодня", isDefault: true },
  { columnId: 'tradeVolume', name: "Объём торгов", isDefault: true },
  { columnId: 'currency', name: "Валюта", isDefault: true },
  { columnId: 'exchange', name: "Биржа", isDefault: false },
  { columnId: 'market', name: "Рынок", isDefault: false },
  { columnId: 'lotSize', name: "Лотность", isDefault: false },
  { columnId: 'price', name: "Цена", isDefault: true },
  { columnId: 'priceMax', name: "Макс. цена", isDefault: true },
  { columnId: 'priceMin', name: "Мин. цена", isDefault: true },
  { columnId: 'priceScale', name: 'Шаг цены', isDefault: true },
  { columnId: 'yield', name: "Доходность", isDefault: false },
];
