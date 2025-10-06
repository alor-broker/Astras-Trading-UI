import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { RibbonItem } from "../components/ribbon/ribbon.component";

export interface RibbonSettings extends WidgetSettings {
  displayItems?: RibbonItem[];
}
