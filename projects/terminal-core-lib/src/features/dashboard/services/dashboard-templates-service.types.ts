import {
  DashboardItemPosition,
  DashboardType,
  InstrumentGroups
} from '../types/dashboard.types';

export interface DefaultDashboardItem {
  widgetTypeId: string;
  initialSettings?: Record<string, unknown>;
}

export interface DefaultDesktopDashboardItem extends DefaultDashboardItem {
  position: DashboardItemPosition;
}

export interface DashboardTemplateConfig {
  id?: string;
  type: DashboardType;
}

export interface DefaultDesktopDashboardConfig extends DashboardTemplateConfig {
  isStandard: boolean;
  isFavorite: boolean;
  name?: string;
  widgets: DefaultDesktopDashboardItem[];
  instrumentsSelection?: InstrumentGroups | null;
}

export interface QuickAccessPanelItem {
  widgetType: string;
  selectedByDefault?: boolean;
  isPreferredOrderWidget?: boolean;
}

export interface DefaultMobileDashboardConfig extends DashboardTemplateConfig {
  widgets: DefaultDashboardItem[];
  quickAccessPanelItems: QuickAccessPanelItem[];
}
