import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {
  BaseColumnId,
  TableDisplaySettings
} from '@terminal-core-lib/features/tables/types/table-display-settings.types';

export interface AdminClientPositionsWidgetSettings extends WidgetSettings {
  table: TableDisplaySettings;
  refreshIntervalSec: number;
}

export const AdminClientPositionsTableColumns: BaseColumnId[] = [
  {id: "symbol", isDefault: true},
  {id: "exchange", isDefault: true},
  {id: "portfolio", isDefault: true},
  {id: "quantityT0", isDefault: true}
];
