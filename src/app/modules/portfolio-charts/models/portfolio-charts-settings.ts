﻿import { WidgetSettings } from "../../../shared/models/widget-settings.model";

export interface PortfolioChartsSettings extends WidgetSettings {
  exchange: string;
  portfolio: string;
}
