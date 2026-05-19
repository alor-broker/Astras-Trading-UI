import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';

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
