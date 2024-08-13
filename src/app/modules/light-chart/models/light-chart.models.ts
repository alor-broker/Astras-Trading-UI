import { Candle } from '../../../shared/models/history/candle.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { LightChartDatafeed } from '../services/light-chart-datafeed';
import { ThemeColors } from '../../../shared/models/settings/theme-settings.model';

export enum TimeframeValue {
  S1 = '1',
  S5 = '5',
  S10 = '10',
  M1 = '60',
  M5 = '300',
  M15 = '900',
  H = '3600',
  H4 = '14400',
  Day = 'D',
  W = 'W',
  Month = 'M'
}

export interface PeriodParams {
  from: number;
  to: number;
  firstDataRequest: boolean;
}

export interface HistoryMetadata {
  noData?: boolean;
  prevTime?: number;
}

export interface InstrumentDetails {
  priceMinStep: number;
}

export declare type HistoryCallback = (bars: Candle[], meta: HistoryMetadata) => void;

export interface LightChartTimeConvertor {
  toDisplayTime: (time: number) => number;
}

export interface LightChartConfig {
  instrumentKey: InstrumentKey;
  timeFrame: TimeframeValue;
  instrumentDetails: InstrumentDetails;
  containerId: string;
  dataFeed: LightChartDatafeed;
  themeColors: ThemeColors;
  timeConvertor?: LightChartTimeConvertor;
  locale: string;
}
