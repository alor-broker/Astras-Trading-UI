import {Widget} from './dashboard.types';
import {WidgetMeta} from '../../widgets-gallery/services/widgets-meta-service.types';

export interface WidgetInstance {
  instance: Widget;
  widgetMeta: WidgetMeta;
}

export interface ContentSize {
  height: number;
  width: number;
}

