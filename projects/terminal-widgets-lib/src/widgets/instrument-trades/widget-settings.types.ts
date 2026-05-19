import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';

export interface InstrumentTradesWidgetSettings extends WidgetSettings, InstrumentKey {
  highlightRowsBySide?: boolean;
  allTradesTable: TableDisplaySettings;

  /**
   * @deprecated use allTradesTable
   */
  allTradesColumns: string[];
}

export const instrumentTradesWidgetColumns: BaseColumnId[] = [
  {id: 'qty', displayName: 'Кол-во', isDefault: true},
  {id: 'price', displayName: 'Цена', isDefault: true},
  {id: 'timestamp', displayName: 'Время', isDefault: true},
  {id: 'side', displayName: 'Сторона', isDefault: false},
  {id: 'oi', displayName: 'Откр. интерес', isDefault: false},
  {id: 'existing', displayName: 'Новое событие', isDefault: false},
];
