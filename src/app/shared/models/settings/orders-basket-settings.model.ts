import { WidgetSettings } from '../widget-settings.model';

export interface OrdersBasketSettings extends WidgetSettings {
  exchange: string,
  portfolio: string
}
