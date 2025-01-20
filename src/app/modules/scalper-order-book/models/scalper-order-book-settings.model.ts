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

export enum PanelSlots {
  TopPanel = 'topPanel',
  BottomFloatingPanel = 'bottomFloatingPanel'
}

export enum TradesClusterHighlightMode {
  Off = 'off',
  BuySellDominance = 'buySellDominance'
}

export interface TradesClusterPanelSettings {
  timeframe: ClusterTimeframe;
  displayIntervalsCount: number;
  volumeDisplayFormat?: NumberDisplayFormat;
  highlightMode?: TradesClusterHighlightMode;
}

export interface OrderBookLayoutSettings {
  widths: Record<string, number>;
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

export interface TradesPanelSettings {
  minTradeVolumeFilter: number;
  hideFilteredTrades: boolean;
  tradesAggregationPeriodMs: number;
  showOwnTrades?: boolean;
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
  tradesPanelSettings?: TradesPanelSettings;
  minorLinesStep?: number;
  majorLinesStep?: number;
  stopLimitOrdersDistance?: number;
  layout?: OrderBookLayoutSettings;
}

export interface ScalperOrderBookInstanceSettings extends InstrumentKey, WidgetSettings {
  disableHotkeys: boolean;
  enableMouseClickSilentOrders: boolean;
  autoAlignIntervalSec?: number;
  enableAutoAlign?: boolean;
  showTradesPanel?: boolean;
  showTradesClustersPanel?: boolean;
  volumeDisplayFormat?: NumberDisplayFormat;
  showPriceWithZeroPadding?: boolean;
  showRuler?: boolean;
  rulerSettings?: RulerSettings;
  showWorkingVolumesPanel?: boolean;
  workingVolumesPanelSlot?: PanelSlots.BottomFloatingPanel | PanelSlots.TopPanel;
  showInstrumentPriceDayChange?: boolean;
  showShortLongIndicators?: boolean;
  shortLongIndicatorsPanelSlot?: PanelSlots.BottomFloatingPanel | PanelSlots.TopPanel;
  shortLongIndicatorsUpdateIntervalSec?: number;
  showLimitOrdersVolumeIndicators?: boolean;
  hideTooltips?: boolean;
  rowHeight?: number;
  fontSize?: number;
  // @deprecated Use shared settings
  instrumentLinkedSettings?: Record<string, InstrumentLinkedSettings>;
}

export interface ScalperOrderBookWidgetSettings extends ScalperOrderBookInstanceSettings, InstrumentLinkedSettings {
}
