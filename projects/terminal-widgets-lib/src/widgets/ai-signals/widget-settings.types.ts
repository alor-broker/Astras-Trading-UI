import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';

export interface AiSignalsWidgetSettings extends WidgetSettings {
  refreshIntervalSec?: number;
}

export const defaultAiSignalsWidgetSettings = {
  refreshIntervalSec: 300
};
