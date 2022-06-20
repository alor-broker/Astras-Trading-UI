import { WidgetSettings } from "../widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface AllTradesSettings extends WidgetSettings, InstrumentKey {
  hasSettings: boolean;
  hasHelp: boolean;
}
