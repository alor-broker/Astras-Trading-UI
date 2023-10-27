import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { DetrendType } from "./instruments-correlation.model";

export interface InstrumentsCorrelationSettings extends WidgetSettings {
  lastRequestParams?: {
    listId: string;
    days: number;
    detrendType: DetrendType;
  };
}
