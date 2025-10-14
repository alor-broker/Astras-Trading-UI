import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { Market } from "../../../../generated/graphql.types";
import {
  ExtendedFilter,
  MarketSector
} from "../../../shared/models/market-typings.model";
import { RibbonItem } from "../../ribbon/components/ribbon/ribbon.component";

export interface MobileHomeScreenSettings extends WidgetSettings {
  showPortfolioDynamics?: boolean;
  showNews?: boolean;
  showIdeas?: boolean;
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
