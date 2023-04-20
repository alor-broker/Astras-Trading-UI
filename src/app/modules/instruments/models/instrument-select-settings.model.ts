import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId } from "../../../shared/models/settings/table-settings.model";

export interface InstrumentSelectSettings extends WidgetSettings {
  activeListId?: string;
  instrumentColumns: string[];
}

export const allInstrumentsColumns: BaseColumnId[] = [
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Назв.", isDefault: true },
  { id: 'price', displayName: "Цена", isDefault: true },
  { id: 'dayChange', displayName: "Д.изм.", isDefault: true },
  { id: 'dayChangePerPrice', displayName: "Д.изм.,%", isDefault: true },
  { id: 'maxPrice', displayName: "Д.макс.", isDefault: false },
  { id: 'minPrice', displayName: "Д.мин.", isDefault: false },
  { id: 'volume', displayName: "Объём", isDefault: false },
  { id: 'openPrice', displayName: "Откр.", isDefault: false },
  { id: 'closePrice', displayName: "Закр.", isDefault: false },
];
