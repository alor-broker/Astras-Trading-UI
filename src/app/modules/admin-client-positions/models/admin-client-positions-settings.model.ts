import {WidgetSettings} from "../../../shared/models/widget-settings.model";
import {
  BaseColumnId,
  TableDisplaySettings
} from "../../../shared/models/settings/table-settings.model";

export interface AdminClientPositionsSettings extends WidgetSettings {
  table: TableDisplaySettings;
  refreshIntervalSec: number;
}

export const AdminClientPositionsTableColumns: BaseColumnId[] = [
  { id: "symbol", isDefault: true},
  { id: "exchange", isDefault: true},
  { id: "portfolio", isDefault: true},
  { id: "quantityT0", isDefault: true}
];
