// increase version if model has incompatible changes

import {DashboardItemPosition, Widget} from './widget.model';
import { PortfolioKey } from '../portfolio-key.model';
import { InstrumentKey } from '../instruments/instrument-key.model';

export const CurrentDashboardVersion = '1.0.0';

export interface Dashboard {
  guid: string;
  title: string;
  version: string;
  items: Widget[];
  isSelected?: boolean;
  selectedPortfolio?: PortfolioKey | null;

  instrumentsSelection?: InstrumentGroups | null;

  sourceGuid?: string;
  isFavorite?: boolean;
  favoritesOrder?: number;
}

export interface InstrumentGroups {
  [groupKey: string]: InstrumentKey | null | undefined;
}

export interface DefaultDashboardItem {
  widgetTypeId: string;
  initialSettings?: { [propName: string]: any};
}

export interface DefaultDesktopDashboardItem extends DefaultDashboardItem{
  position: DashboardItemPosition;
}

export interface DefaultDashboardConfig {
  type: 'desktop' | 'mobile';
}

export interface DefaultDesktopDashboardConfig extends DefaultDashboardConfig {
  isStandard: boolean;
  isFavorite: boolean;
  name: string;
  widgets: DefaultDesktopDashboardItem[];
}

export interface DefaultMobileDashboardConfig extends DefaultDashboardConfig {
  widgets: DefaultDashboardItem[];
}
