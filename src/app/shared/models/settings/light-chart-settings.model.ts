import { WidgetSettings } from "src/app/shared/models/widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface LightChartSettings extends WidgetSettings, InstrumentKey {
  timeFrame: string,
  from: number,
  width: number,
  height: number
}
