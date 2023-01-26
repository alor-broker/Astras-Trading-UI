// increase version if model has incompatible changes

import { Widget } from './widget.model';
import { PortfolioKey } from '../portfolio-key.model';
import { InstrumentKey } from '../instruments/instrument-key.model';

export const CurrentDashboardVersion = '1.0.0';

export const DefaultDashboardName = 'Default Dashboard';

export interface Dashboard {
  guid: string;
  title: string;
  version: string;
  items: Widget[];
  isSelected?: boolean;
  selectedPortfolio?: PortfolioKey | null;

  instrumentsSelection?: InstrumentGroups | null;
}

export interface InstrumentGroups {
  [groupKey: string]: InstrumentKey
}
