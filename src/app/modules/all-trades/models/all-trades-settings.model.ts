import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface ColumnIds {
  columnId: string;
  name: string;
  isDefault: boolean;
}

export interface AllTradesSettings extends WidgetSettings, InstrumentKey {
  allTradesColumns: string[];
}

export const allTradesWidgetColumns: ColumnIds[] = [
  { columnId: 'qty', name: 'Кол-во', isDefault: true },
  { columnId: 'price', name: 'Цена', isDefault: true },
  { columnId: 'timestamp', name: 'Время', isDefault: true },
  { columnId: 'side', name: 'Сторона', isDefault: false },
  { columnId: 'oi', name: 'Откр. интерес', isDefault: false },
  { columnId: 'existing', name: 'Новое событие', isDefault: false },
];
