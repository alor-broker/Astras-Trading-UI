import { WidgetSettings } from '../../../shared/models/widget-settings.model';

export enum LineMarkerPosition {
  Right = 'right',
  Middle = 'middle',
  Left = 'left'
}

export interface TechChartSettings extends WidgetSettings {
  chartLayout?: object;
  showTrades?: boolean;
  showOrders?: boolean;
  ordersLineMarkerPosition?: LineMarkerPosition;
  showPosition?: boolean;
  positionLineMarkerPosition?: LineMarkerPosition;
  symbol: string;
  exchange?: string;
  instrumentGroup?: string;
  isin?: string;
}
