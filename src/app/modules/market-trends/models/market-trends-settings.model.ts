import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { MarketSector } from "../../../shared/models/market-typings.model";

export interface MarketTrendsSettings extends WidgetSettings {
  displaySectors: MarketSector[];
  itemsCount: number;
}
