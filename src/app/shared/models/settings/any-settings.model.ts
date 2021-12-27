import { Widget } from "../widget.model";
import { InstrumentSelectSettings } from "./instrument-select-settings.model";
import { LightChartSettings } from "./light-chart-settings.model";
import { OrderbookSettings } from "./orderbook-settings.model";

export type AnySettings = (LightChartSettings | OrderbookSettings | InstrumentSelectSettings)
