import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { Market } from "../../../../generated/graphql.types";

export interface MobileHomeScreenSettings extends WidgetSettings {
  showPortfolioDynamics?: boolean;
  showNews?: boolean;
  showIdeas?: boolean;
  displayTrendsForMarket?: Market[];
  ignoreTrendsForBoards?: string[];
}
