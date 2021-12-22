import { DashboardItem } from "./dashboard-item.model"

export interface Widget<T> {
  title: string,
  gridItem: DashboardItem,
  settings: T
}
