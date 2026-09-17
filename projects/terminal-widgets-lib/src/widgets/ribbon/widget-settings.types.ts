import {WidgetSettings} from '@terminal-core-lib/features/widget-settings/widget-settings.types';

import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

export enum RibbonLayout {
  SingleRow = 'singleRow',
  TwoRows = '2row'
}

export interface RibbonItem extends InstrumentKey {
  displayName?: string;
  isFutures?: boolean;
}

export interface RibbonWidgetSettings extends WidgetSettings {
  displayItems?: RibbonItem[];
  refreshIntervalSec?: number;
  layout?: RibbonLayout;
}

export const RIBBON_REFRESH_INTERVAL = {min: 5, max: 300, defaultValue: 60} as const;

export const DEFAULT_RIBBON_ITEMS: readonly RibbonItem[] = [
  {symbol: 'IMOEX', exchange: 'MOEX'},
  {symbol: 'RTSI', exchange: 'MOEX'},
  {symbol: 'USD000UTSTOM', exchange: 'MOEX', displayName: 'USD/РУБ'},
  {symbol: 'CNYRUB_TOM', exchange: 'MOEX', displayName: 'CNY/РУБ'},
  {symbol: 'BR', exchange: 'MOEX', displayName: 'Oil (Brent)', isFutures: true},
  {symbol: 'GOLD', exchange: 'MOEX', displayName: 'Gold', isFutures: true}
];
