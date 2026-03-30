import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";

export interface TradeScreenSettings extends WidgetSettings, InstrumentKey {
  chart: {
    availableTimeFrames: TimeframeValue[];
  };

  orderbook: {
    depth: number;
  };
}
