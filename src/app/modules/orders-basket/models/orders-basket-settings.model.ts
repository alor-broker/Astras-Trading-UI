import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { OrdersBasket } from "./orders-basket-form.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";

export interface DataPreset extends OrdersBasket {
  id: string;
  title: string;
  portfolioKey: PortfolioKey;
}

export interface OrdersBasketSettings extends WidgetSettings {
  exchange: string;
  portfolio: string;
  showPresetsPanel?: boolean;
  presets?: DataPreset[];
}
