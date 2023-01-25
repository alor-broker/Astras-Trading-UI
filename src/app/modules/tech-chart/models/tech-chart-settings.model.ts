import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface TechChartSettings extends WidgetSettings, InstrumentKey {
  chartSettings: { [key: string]: string };
}
