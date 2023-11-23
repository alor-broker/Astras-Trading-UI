import { WidgetSettings } from '../../../shared/models/widget-settings.model';

export interface TechChartSettings extends WidgetSettings {
  chartLayout?: object;
  showTrades?: boolean;
  symbol: string;
  exchange?: string;
  instrumentGroup?: string;
  isin?: string;
}
