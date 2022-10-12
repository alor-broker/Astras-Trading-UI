import { WidgetSettings } from "src/app/shared/models/widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export enum TimeFrameDisplayMode {
  Buttons = 'buttons',
  Menu = 'menu',
  Hide = 'hide'
}

export interface LightChartSettings extends WidgetSettings, InstrumentKey {
  timeFrame: string,
  width: number,
  height: number,
  timeFrameDisplayMode?: TimeFrameDisplayMode
}
