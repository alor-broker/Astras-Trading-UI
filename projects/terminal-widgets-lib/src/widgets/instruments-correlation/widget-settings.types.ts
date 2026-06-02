import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {DetrendType} from '@terminal-widgets-lib/widgets/instruments-correlation/types/instruments-correlation.types';

export interface InstrumentsCorrelationWidgetSettings extends WidgetSettings {
  lastRequestParams?: {
    listId: string;
    days: number;
    detrendType: DetrendType;
  };
}
