import { WidgetSettings } from '../../../shared/models/widget-settings.model';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { NumberDisplayFormat } from '../../../shared/models/enums/number-display-format';

export enum ClusterTimeframe {
  M1 = 60,
  M5 = 300,
  M15 = 900,
  H1 = 3600
}

export enum PriceUnits {
  Points = 'points',
  Percents = 'percents'
}

export interface TradesClusterPanelSettings {
  timeframe: ClusterTimeframe;
  displayIntervalsCount: number;
  volumeDisplayFormat?: NumberDisplayFormat;
}

export interface OrderBookLayoutSettings {
  widths: {[K:string]: number};
}

export interface RulerSettings {
  markerDisplayFormat: PriceUnits;
}

export interface BracketsSettings {
  orderPriceUnits?: PriceUnits;
  topOrderPriceRatio?: number;
  bottomOrderPriceRatio?: number;
  useBracketsWhenClosingPosition?: boolean;
}

export enum VolumeHighlightMode {
  Off = 'off',
  BiggestVolume = 'biggestVolume',
  VolumeBoundsWithFixedValue = 'volumeBoundsWithFixedValue'
}

export interface VolumeHighlightOption {
  boundary: number;
  color: string;
}

export interface InstrumentLinkedSettings {
  depth?: number;
  showZeroVolumeItems: boolean;
  showSpreadItems: boolean;
  volumeHighlightMode?: VolumeHighlightMode;
  volumeHighlightOptions: VolumeHighlightOption[];
  volumeHighlightFullness?: number;
  workingVolumes: number[];
  tradesClusterPanelSettings?: TradesClusterPanelSettings;
  bracketsSettings?: BracketsSettings;
}

export interface ScalperOrderBookWidgetSettings extends WidgetSettings, InstrumentKey, InstrumentLinkedSettings {
  disableHotkeys: boolean;
  enableMouseClickSilentOrders: boolean;
  autoAlignIntervalSec?: number;
  enableAutoAlign?: boolean;
  showTradesPanel?: boolean;
  showTradesClustersPanel?: boolean;
  volumeDisplayFormat?: NumberDisplayFormat;
  showPriceWithZeroPadding?: boolean;
  layout?: OrderBookLayoutSettings;
  showRuler?: boolean;
  rulerSettings?: RulerSettings;
  useBrackets?: boolean;
  showInstrumentPriceDayChange?: boolean;
  instrumentLinkedSettings?: {
    [key: string]: InstrumentLinkedSettings;
  };
}
