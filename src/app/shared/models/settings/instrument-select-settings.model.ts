import { WidgetSettings } from "../widget-settings.model";

export interface InstrumentSelectSettings extends WidgetSettings {
  title?: string,
  linkToActive?: boolean,
  guid: string
}
