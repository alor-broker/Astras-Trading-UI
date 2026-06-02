import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';
import {Market} from '@terminal-core-lib/common/types/instrument.types';
import {
  ExtendedFilter,
  MarketSector
} from '@terminal-widgets-lib/widgets/market-trends/types/market-trends.types';
import {RibbonItem} from '@terminal-widgets-lib/widgets/ribbon/widget-settings.types';

export interface MobileHomeScreenWidgetSettings extends WidgetSettings {
  showPortfolioDynamics?: boolean;
  showNews?: boolean;
  showIdeas?: boolean;
  showMarketTrends?: boolean;
  marketTrendsMarkets?: Market[];
  marketTrendsIgnoredBoards?: string[];
  marketTrendsInstrumentTypes?: string[];
  marketTrendsMinTradeAmount?: number;
  marketTrendsMinCapitalization?: number;
  marketTrendsItemsCount?: number;
  marketTrendsSectors?: MarketSector[];
  marketTrendsExtendedFilter?: ExtendedFilter[];
  ribbonSettings?: {
    displayItems?: RibbonItem[];
  };
}
