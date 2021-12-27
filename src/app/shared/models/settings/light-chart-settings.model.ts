import { WidgetSettings } from "src/app/shared/models/widget-settings.model";

export interface LightChartSettings extends WidgetSettings {
  exchange: string,
  symbol: string,
  timeFrame: string,
  from: number,
  instrumentGroup?: string
}
