import { WidgetSettings } from '../../../shared/models/widget-settings.model';

export interface OrdersBasketSettings extends WidgetSettings {
  exchange: string,
  portfolio: string
}
