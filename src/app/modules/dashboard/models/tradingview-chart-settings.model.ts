import { WidgetSettings } from "src/app/shared/models/widget-settings.model";

export interface TradingviewChartSettings extends WidgetSettings {
  exchange: string,
  symbol: string
}
