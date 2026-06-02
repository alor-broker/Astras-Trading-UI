import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';

export interface RibbonItem {
  displayName?: string;
  symbol: string;
  exchange: string;
  isFutures?: boolean;
}

export interface RibbonWidgetSettings extends WidgetSettings {
  displayItems?: RibbonItem[];
}
