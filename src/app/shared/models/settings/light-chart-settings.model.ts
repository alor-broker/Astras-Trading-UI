import { WidgetSettings } from "src/app/shared/models/widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface LightChartSettings extends WidgetSettings, InstrumentKey {
  timeFrame: string,
  width: number,
  height: number
}
