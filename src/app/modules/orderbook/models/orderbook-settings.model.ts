import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';

export interface OrderbookSettings extends WidgetSettings, InstrumentKey {
  depth?: number;
  showChart: boolean;
  showTable: boolean;
  showYieldForBonds: boolean;
  useOrderWidget: boolean;
  showVolume: boolean;
}
