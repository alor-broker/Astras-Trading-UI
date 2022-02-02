import { WidgetSettings } from "src/app/shared/models/widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface LightChartSettings extends WidgetSettings, InstrumentKey {
  title?: string,
  timeFrame: string,
  from: number,
  linkToActive?: boolean,
  guid: string,
  width: number,
  height: number
}
