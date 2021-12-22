import { WidgetSettings } from "src/app/shared/models/widget-settings.model";

export interface OrderbookSettings extends WidgetSettings {
  symbol: string,
  exchange: string,
}
