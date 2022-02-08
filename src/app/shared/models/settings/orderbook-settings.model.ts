import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { InstrumentKey } from '../instruments/instrument-key.model';

export interface OrderbookSettings extends WidgetSettings, InstrumentKey {
  title?: string,
  guid: string,
  depth?: number,
  linkToActive?: boolean,
  showChart: boolean,
  showTable: boolean
}
