import { WidgetSettings } from "src/app/shared/models/widget-settings.model";
import { InstrumentKey } from "../instruments/instrument-key.model";

export interface LightChartSettings extends WidgetSettings, InstrumentKey {
  timeFrame: string,
  from: number,
  linkToActive?: boolean
}

export function isEqual(
  settings1?: LightChartSettings,
  settings2?: LightChartSettings
) {
  if (settings1 && settings2) {
    return (
      settings1.symbol == settings2.symbol &&
      settings1.instrumentGroup == settings2.instrumentGroup &&
      settings1.linkToActive == settings2.linkToActive &&
      settings1.exchange == settings2.exchange &&
      settings1.timeFrame == settings2.timeFrame &&
      settings1.from == settings2.from
    );
  } else return false;
}
