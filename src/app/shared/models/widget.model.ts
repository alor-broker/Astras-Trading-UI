import { DashboardItem } from "./dashboard-item.model";

export interface Widget {
  gridItem: DashboardItem,
  guid: string,
  hasSettings: boolean,
  hasHelp: boolean
}
