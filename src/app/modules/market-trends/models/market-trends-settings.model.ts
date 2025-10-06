import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import {
  ExtendedFilter,
  MarketSector
} from "../../../shared/models/market-typings.model";
import { Market } from "../../../../generated/graphql.types";

export interface MarketTrendsSettings extends WidgetSettings {
  availableSectors: MarketSector[];
  displaySectors: MarketSector[];
  marketFilters?: {
    targetMarkets?: Market[];
    ignoredBoards?: string[];
    instrumentTypes?: string[];
    minTradeAmount?: number;
    minCapitalization?: number;
    maxItemPrice?: number;
  };
  availableExtendedFilters: ExtendedFilter[];
  extendedFilter: ExtendedFilter[];
  itemsCount: number;
}
