import {Candle} from '@terminal-core-lib/features/instruments/services/candles-service.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {LightChartDatafeed} from '@terminal-widgets-lib/widgets/light-chart/services/light-chart-datafeed';

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
