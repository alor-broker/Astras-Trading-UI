import { GridsterItem } from "angular-gridster2";

export interface DashboardItemContentSize {
  height: number,
  width: number,
}

export interface DashboardItem extends GridsterItem{
  height?: number,
  width?: number,
}
