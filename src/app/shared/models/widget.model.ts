import { DashboardItem } from "./dashboard-item.model"

export interface Widget {
  title: string,
  gridItem: DashboardItem,
  settings: object
}
