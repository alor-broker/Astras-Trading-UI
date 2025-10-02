import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import {
  ExtendedFilter,
  MarketSector
} from "../../../shared/models/market-typings.model";

export interface MarketTrendsSettings extends WidgetSettings {
  availableSectors: MarketSector[];
  displaySectors: MarketSector[];
  availableExtendedFilters: ExtendedFilter[];
  extendedFilter: ExtendedFilter[];
  itemsCount: number;
}
