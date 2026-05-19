import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';

export interface MobileTradeScreenWidgetSettings extends WidgetSettings, InstrumentKey {
  chart: {
    availableTimeFrames: TimeframeValue[];
  };

  orderbook: {
    depth: number;
  };
}
