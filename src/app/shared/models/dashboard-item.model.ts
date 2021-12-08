import { GridsterItem } from "angular-gridster2";
import { ComponentType } from '@angular/cdk/overlay';

export interface DashboardItem extends GridsterItem {
  height?: number,
  width?: number,
}
