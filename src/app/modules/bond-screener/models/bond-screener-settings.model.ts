import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { BaseColumnId, TableDisplaySettings } from "../../../shared/models/settings/table-settings.model";

export interface BondScreenerSettings extends WidgetSettings {
  bondScreenerTable: TableDisplaySettings;
}

export const bondScreenerColumns: BaseColumnId[] = [
  { id: 'symbol', displayName: "Тикер", isDefault: true },
  { id: 'shortName', displayName: "Назв.", isDefault: true }
];
