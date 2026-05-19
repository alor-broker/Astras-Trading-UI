import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {
  ExtendedFilter,
  MarketSector
} from '@terminal-widgets-lib/widgets/market-trends/types/market-trends.types';
import {Market} from '@terminal-core-lib/features/instruments/graphql/schema/graphql.types';

export interface MarketTrendsWidgetSettings extends WidgetSettings {
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
