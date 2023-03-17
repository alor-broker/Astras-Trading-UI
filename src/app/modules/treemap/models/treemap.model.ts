import { WidgetSettings } from "../../../shared/models/widget-settings.model";

export const maxDayChange = 5;
export const averageTileSize = 4000;

export interface TreemapNode {
  dayChange: number;
  dayChangeAbs: number;
  marketCap: number;
  sector: string;
  symbol: string;
}

export interface TreemapSettings extends WidgetSettings {
}
