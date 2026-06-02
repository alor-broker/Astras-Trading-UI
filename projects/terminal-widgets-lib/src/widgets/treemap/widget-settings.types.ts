import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';

export interface TreemapWidgetSettings extends WidgetSettings {
  refreshIntervalSec?: number;
}
