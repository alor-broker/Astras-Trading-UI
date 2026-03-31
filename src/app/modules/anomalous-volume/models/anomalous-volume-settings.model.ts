import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { BaseColumnId, TableDisplaySettings } from '../../../shared/models/settings/table-settings.model';

export type AnomalousVolumeTimeframe = '1m' | '5m' | '15m';

export enum AnomalousVolumeSourceMode {
  Manual = 'manual',
  DashboardInstrument = 'dashboard-instrument',
  DashboardPortfolio = 'dashboard-portfolio',
  MoexTopTurnoverSession = 'moex-top-turnover-session'
}

export interface AnomalousVolumeSettings extends WidgetSettings {
  instruments: InstrumentKey[];
  sourceMode: AnomalousVolumeSourceMode;
  topTurnoverLimit: number;
  excludeZeroPositions: boolean;
  timeframe: AnomalousVolumeTimeframe;
  windowSize: number;
  sigmaMultiplier: number;
  soundAlertEnabled: boolean;
  showLargeTrades: boolean;
  largeTradeMinVolume: number;
  maxInstruments: number;
  anomalousVolumeTable?: TableDisplaySettings;
  anomalousVolumeColumns: string[];
}

export const anomalousVolumeWidgetColumns: BaseColumnId[] = [
  { id: 'eventType', displayName: 'Тип события', isDefault: true },
  { id: 'ticker', displayName: 'Тикер', isDefault: true },
  { id: 'instrument', displayName: 'Инструмент', isDefault: true },
  { id: 'direction', displayName: 'Направление', isDefault: true },
  { id: 'lots', displayName: 'Лоты', isDefault: true },
  { id: 'moneyVolume', displayName: 'Объём в деньгах', isDefault: true },
  { id: 'changePercent', displayName: 'Изменение %', isDefault: true },
  { id: 'buyPercent', displayName: 'Покупки %', isDefault: true },
  { id: 'sellPercent', displayName: 'Продажи %', isDefault: true },
  { id: 'date', displayName: 'Дата', isDefault: true },
  { id: 'time', displayName: 'Время выявления', isDefault: true }
];
