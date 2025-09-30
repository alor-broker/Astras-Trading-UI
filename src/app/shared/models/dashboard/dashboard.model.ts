// increase version if model has incompatible changes

import {DashboardItemPosition, Widget} from './widget.model';
import { PortfolioKey } from '../portfolio-key.model';
import { InstrumentKey } from '../instruments/instrument-key.model';

export const CurrentDashboardVersion = '1.0.0';

export enum ClientDashboardType {
  ClientDesktop = 'desktop',
  ClientMobile = 'mobile'
}

export enum AdminDashboardType {
  AdminMain = 'admin-main',
  AdminSelectedPortfolio = 'admin-selected-portfolio'
}

export type DashboardType = ClientDashboardType | AdminDashboardType;

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
  isLocked?: boolean;
  favoritesOrder?: number;
  type?: DashboardType;
}

export type InstrumentGroups = Record<string, InstrumentKey>;

export interface DefaultDashboardItem {
  widgetTypeId: string;
  initialSettings?: Record<string, any>;
}

export interface DefaultDesktopDashboardItem extends DefaultDashboardItem {
  position: DashboardItemPosition;
}

export interface DefaultDashboardConfig {
  type: DashboardType;
}

export interface DefaultDesktopDashboardConfig extends DefaultDashboardConfig {
  isStandard?: boolean;
  isFavorite?: boolean;
  name?: string;
  widgets: DefaultDesktopDashboardItem[];
}

export interface DefaultMobileDashboardConfig extends DefaultDashboardConfig {
  widgets: DefaultDashboardItem[];
}
