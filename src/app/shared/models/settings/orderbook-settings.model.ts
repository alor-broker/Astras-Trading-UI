import { WidgetSettings } from 'src/app/shared/models/widget-settings.model';
import { InstrumentKey } from '../instruments/instrument-key.model';

export interface OrderbookSettings extends WidgetSettings, InstrumentKey {
  title?: string,
  guid: string,
  depth?: number;
  linkToActive?: boolean;
}

export function isEqual(
  settings1: OrderbookSettings,
  settings2: OrderbookSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.guid == settings2.guid &&
      settings1.symbol == settings2.symbol &&
      settings1.instrumentGroup == settings2.instrumentGroup &&
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.depth == settings2.depth
    );
  } else return false;
}
