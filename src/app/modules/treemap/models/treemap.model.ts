import { WidgetSettings } from "../../../shared/models/widget-settings.model";

export interface TreemapNode {
  dayChange: number;
  dayChangeAbs: number;
  marketCap: number;
  sector: string;
  symbol: string;
}

export interface TreemapSettings extends WidgetSettings {
  refreshIntervalSec?: number;
}
