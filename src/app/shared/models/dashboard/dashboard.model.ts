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
  templateId?: string;
}

export type InstrumentGroups = Record<string, InstrumentKey>;

export interface DefaultDashboardItem {
  widgetTypeId: string;
  initialSettings?: Record<string, any>;
}

export interface DefaultDesktopDashboardItem extends DefaultDashboardItem {
  position: DashboardItemPosition;
}

export interface DashboardTemplateConfig {
  id?: string;
  type: 'desktop' | 'mobile' | 'admin';
}

export interface DefaultDesktopDashboardConfig extends DashboardTemplateConfig {
  isStandard: boolean;
  isFavorite: boolean;
  name: string;
  widgets: DefaultDesktopDashboardItem[];
}

export interface DefaultAdminDashboardConfig extends DashboardTemplateConfig {
  widgets: DefaultDesktopDashboardItem[];
}

export interface DefaultMobileDashboardConfig extends DashboardTemplateConfig {
  widgets: DefaultDashboardItem[];
}
