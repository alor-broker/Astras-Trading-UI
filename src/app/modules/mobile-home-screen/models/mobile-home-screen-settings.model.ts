import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { Market } from "../../../../generated/graphql.types";

export interface MobileHomeScreenSettings extends WidgetSettings {
  showPortfolioDynamics: boolean;
  displayTrendsForMarket?: Market[];
  ignoreTrendsForBoards?: string[];
}
