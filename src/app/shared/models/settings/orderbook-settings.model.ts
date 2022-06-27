import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { InstrumentKey } from '../instruments/instrument-key.model';

export interface OrderbookSettings extends WidgetSettings, InstrumentKey {
  depth?: number,
  showChart: boolean,
  showTable: boolean
  showYieldForBonds: boolean
}
