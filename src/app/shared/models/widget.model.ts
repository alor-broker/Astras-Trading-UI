import { DashboardItem } from "./dashboard-item.model"

export interface Widget<T> {
  gridItem: DashboardItem,
  settings: T
}
