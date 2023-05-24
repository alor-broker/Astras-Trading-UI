import {Widget} from "./widget.model";
import {WidgetMeta} from "../widget-meta.model";

export interface WidgetInstance {
  instance: Widget;
  widgetMeta: WidgetMeta;
}

export interface ContentSize {
  height: number;
  width: number;
}
