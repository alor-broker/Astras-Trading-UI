import {OrdersBasket} from '@terminal-widgets-lib/widgets/orders-basket/types/orders-basket-form.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';

export interface DataPreset extends OrdersBasket {
  id: string;
  title: string;
  portfolioKey: PortfolioKey;
}

export interface OrdersBasketWidgetSettings extends WidgetSettings {
  exchange: string;
  portfolio: string;
  showPresetsPanel?: boolean;
  presets?: DataPreset[];
}
