import { DashboardItem } from "./dashboard-item.model";
import { AnySettings } from "./settings/any-settings.model";

export interface NewWidget {
  gridItem: DashboardItem,
  settings?: AnySettings
}
