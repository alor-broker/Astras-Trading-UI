import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';

export interface PortfolioChartsWidgetSettings extends WidgetSettings {
  exchange: string;
  portfolio: string;
}
