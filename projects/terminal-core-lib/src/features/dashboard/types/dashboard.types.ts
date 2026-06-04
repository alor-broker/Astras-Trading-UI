import {InstrumentKey} from '../../../common/types/instrument.types';
import {PortfolioKey} from '../../../common/types/portfolio.types';

export type InstrumentGroups = Record<string, InstrumentKey>;

export const CurrentDashboardVersion = '1.1.0';

export enum ClientDashboardType {
  ClientDesktop = 'desktop',
  ClientMobile = 'mobile'
}

export enum AdminDashboardType {
  AdminMain = 'admin-main',
  AdminSelectedPortfolio = 'admin-selected-portfolio'
}

export type DashboardType = ClientDashboardType | AdminDashboardType;

export interface DashboardItemPosition {
  x: number;
  y: number;
  cols: number;
  rows: number;
}

export interface Widget {
  guid: string;
  widgetType: string;
  position?: DashboardItemPosition;

  initialSettings?: Record<string, unknown>;
  initialSize?: {
    cols: number;
    rows: number;
  };
}

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
  templateId?: string;
}
