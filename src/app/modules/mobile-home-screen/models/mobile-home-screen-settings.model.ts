import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { Market } from "../../../../generated/graphql.types";
import { MarketSector } from "../../../shared/models/market-typings.model";

export interface MobileHomeScreenSettings extends WidgetSettings {
  showPortfolioDynamics?: boolean;
  showNews?: boolean;
  showIdeas?: boolean;
  displayTrendsForMarket?: Market[];
  ignoreTrendsForBoards?: string[];
  marketTrendsSectors?: MarketSector[];
}
