import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { TimeframeValue } from "./light-chart.models";

export enum TimeFrameDisplayMode {
  Buttons = 'buttons',
  Menu = 'menu',
  Hide = 'hide'
}

export interface LightChartWidgetSettings extends WidgetSettings, InstrumentKey {
  timeFrame: TimeframeValue;
  timeFrameDisplayMode?: TimeFrameDisplayMode;
  availableTimeFrames?: TimeframeValue[];
}
