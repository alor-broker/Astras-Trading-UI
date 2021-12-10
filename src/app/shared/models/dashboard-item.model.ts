import { GridsterItem } from "angular-gridster2";
import { ComponentType } from '@angular/cdk/overlay';

export interface DashboardItem {
  item: GridsterItem,
  height?: number,
  width?: number,
}
