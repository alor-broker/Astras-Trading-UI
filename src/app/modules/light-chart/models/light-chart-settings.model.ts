import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { TimeframeValue } from "./light-chart.models";

export enum TimeFrameDisplayMode {
  Buttons = 'buttons',
  Menu = 'menu',
  Hide = 'hide'
}

export interface LightChartSettings extends WidgetSettings, InstrumentKey {
  timeFrame: TimeframeValue;
  width: number;
  height: number;
  timeFrameDisplayMode?: TimeFrameDisplayMode;
  availableTimeFrames?: TimeframeValue[];
}
