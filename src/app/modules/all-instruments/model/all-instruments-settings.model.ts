import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId, TableDisplaySettings } from "../../../shared/models/settings/table-settings.model";

export interface AllInstrumentsSettings extends WidgetSettings {
  allInstrumentsTable: TableDisplaySettings;

  /**
   * @deprecated use allInstrumentsTable
   */
  allInstrumentsColumns: string[];
}

export const allInstrumentsColumns: BaseColumnId[] = [
  { id: 'name', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Название", isDefault: true },
  { id: 'dailyGrowth', displayName: "Рост за сегодня", isDefault: true },
  { id: 'dailyGrowthPercent', displayName: "Рост за сегодня, %", isDefault: false },
  { id: 'tradeVolume', displayName: "Объём торгов", isDefault: false },
  { id: 'tradeAmount', displayName: "Объём торгов в базовой валюте", isDefault: true },
  { id: 'currency', displayName: "Валюта", isDefault: true },
  { id: 'exchange', displayName: "Биржа", isDefault: false },
  { id: 'board', displayName: "Режим торгов", isDefault: false },
  { id: 'market', displayName: "Рынок", isDefault: false },
  { id: 'lotSize', displayName: "Лотность", isDefault: false },
  { id: 'price', displayName: "Цена", isDefault: true },
  { id: 'priceMax', displayName: "Макс. цена", isDefault: true },
  { id: 'priceMin', displayName: "Мин. цена", isDefault: true },
  { id: 'priceScale', displayName: 'Шаг цены', isDefault: true },
  { id: 'priceStep', displayName: 'Стоимость шага цены', isDefault: true }
];
