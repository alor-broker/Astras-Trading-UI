import {
  BodyRow,
  CurrentOrderDisplay
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  TradesPanelSettings,
  TradesClusterHighlightMode,
  VolumeHighlightMode,
  VolumeHighlightOption
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {TradesCluster} from '@terminal-widgets-lib/widgets/scalper-order-book/types/trades-clusters.types';
import {InstrumentTradesItem} from '@terminal-core-lib/features/instruments/services/instrument-trades-service.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {Side} from '@terminal-core-lib/common/types/side.types';

/**
 * Идентификаторы вертикальных секций виджета.
 * Совпадают со значениями, используемыми в layout.widths настроек scalper-order-book,
 * чтобы сохраненные layout настройки были совместимы между виджетами.
 */
export enum RenderPanelId {
  TradeClusters = 'trade-clusters',
  Trades = 'current-trades',
  OrderBookTable = 'orders-table'
}

/** Цвета темы, необходимые рендеру. Значения - любые валидные CSS цвета. */
export interface RenderThemeColors {
  buyColor: string;
  sellColor: string;
  mixColor: string;
  buyColorBackground: string;
  sellColorBackground: string;
  buyColorBackgroundLight: string;
  buyColorAccent: string;
  sellColorAccent: string;
  buySellBtnTextColor: string;
  componentBackground: string;
  primaryColor: string;
  textColor: string;
  textMaxContrastColor: string;
  tableGridColor: string;
  tableBorderColor: string;
  disabledColor: string;
  warningColor: string;
}

/** Цвет, преобразованный к виду, пригодному для pixi. */
export interface FillSpec {
  color: number;
  alpha: number;
}

/** Тема, преобразованная к числовым цветам pixi. */
export interface ResolvedTheme {
  readonly buy: FillSpec;
  readonly sell: FillSpec;
  readonly mix: FillSpec;
  readonly buyBackground: FillSpec;
  readonly sellBackground: FillSpec;
  readonly buyBackgroundLight: FillSpec;
  readonly buyAccent: FillSpec;
  readonly sellAccent: FillSpec;
  readonly buySellBtnText: FillSpec;
  readonly componentBackground: FillSpec;
  readonly primary: FillSpec;
  readonly text: FillSpec;
  readonly textMaxContrast: FillSpec;
  readonly tableGrid: FillSpec;
  readonly tableBorder: FillSpec;
  readonly disabled: FillSpec;
  readonly warning: FillSpec;
}

/** Настройки отображения таблицы стакана, влияющие на отрисовку. */
export interface TableDisplaySettings {
  volumeHighlightMode: VolumeHighlightMode;
  volumeHighlightOptions: VolumeHighlightOption[];
  volumeHighlightFullness: number;
  volumeDisplayFormat: NumberDisplayFormat;
  /** Количество знаков после запятой для цены. null - без выравнивания нулями. */
  priceDecimalsCount: number | null;
  /** Локаль для форматирования чисел. */
  locale: string;
}

/** Настройки отображения панели кластеров. */
export interface ClustersDisplaySettings {
  volumeDisplayFormat: NumberDisplayFormat;
  highlightMode: TradesClusterHighlightMode;
  targetVolume: number | null;
  displayIntervalsCount: number;
}

/** Собственная сделка, подготовленная для отрисовки. */
export interface OwnTradeDisplay {
  price: number;
  qtyBatch: number;
  side: Side;
}

/** Видимость и ширины секций. */
export interface RenderLayoutSettings {
  /** Ширины секций в процентах, ключи - RenderPanelId. */
  widths: Record<string, number>;
  showTradesPanel: boolean;
  showClustersPanel: boolean;
}

export interface PanelRect {
  x: number;
  width: number;
}

/** Колонки таблицы стакана (внутри секции таблицы). */
export interface TableColumns {
  volume: PanelRect;
  price: PanelRect;
  orders: PanelRect;
}

export interface ComputedLayout {
  clusters: PanelRect | null;
  trades: PanelRect | null;
  table: PanelRect;
  tableColumns: TableColumns;
}

export interface ViewportMetrics {
  /** Ширина канвы в CSS px. */
  width: number;
  /** Высота канвы в CSS px. */
  height: number;
  rowHeight: number;
  fontSize: number;
  /** Смещение прокрутки в px от начала списка строк. */
  scrollOffset: number;
}

export interface VisibleRange {
  start: number;
  end: number;
}

export interface HoveredRowInfo {
  rowIndex: number;
  price: number;
  /** Координата Y верха строки в координатах канвы. */
  y: number;
}

/** Состояние перетаскивания индикатора заявок. */
export interface ActiveOrderDrag {
  orders: CurrentOrderDisplay[];
  sourceRowIndex: number;
  currentRowIndex: number;
}

/** Состояние горизонтальной прокрутки панели кластеров. */
export interface ClustersScrollState {
  /** Смещение от левого края контента в px. */
  offset: number;
  columnWidth: number;
  totalWidth: number;
}

/** Полная модель данных рендера. Заполняется фасадом, читается элементами. */
export interface RenderModelState {
  /** Строки стакана по убыванию цены. */
  rows: BodyRow[];
  orders: CurrentOrderDisplay[];
  /** Все сделки, отсортированные по возрастанию timestamp. */
  trades: InstrumentTradesItem[];
  /** Собственные сделки, уже отфильтрованные по текущей позиции. */
  ownTrades: OwnTradeDisplay[];
  /** Кластеры для отображения, от старых к новым. */
  clusters: TradesCluster[];
  displaySettings: TableDisplaySettings;
  tradesPanelSettings: TradesPanelSettings;
  clustersSettings: ClustersDisplaySettings;
  showGrowingVolume: boolean;
}

/** Флаги изменения данных. Используются для выборочного обновления элементов. */
export enum DirtyFlags {
  None = 0,
  Rows = 1,
  Orders = 1 << 1,
  Trades = 1 << 2,
  OwnTrades = 1 << 3,
  Clusters = 1 << 4,
  Theme = 1 << 5,
  Settings = 1 << 6,
  Layout = 1 << 7,
  Viewport = 1 << 8,
  Hover = 1 << 9,
  Drag = 1 << 10,
  ClustersScroll = 1 << 11,
  All = (1 << 12) - 1
}

/** Форматирование значений для отрисовки. */
export interface ValueFormatters {
  formatVolume(value: number, format: NumberDisplayFormat): string;
  formatPrice(value: number, decimalsCount: number | null): string;
}

/** Контекст кадра, передаваемый элементам отрисовки. */
export interface FrameContext {
  readonly model: RenderModelState;
  readonly viewport: ViewportMetrics;
  readonly layout: ComputedLayout;
  readonly theme: ResolvedTheme;
  /** Диапазон видимых строк (включительно) или null, если строк нет. */
  readonly visibleRange: VisibleRange | null;
  readonly fonts: FontProvider;
  readonly formatters: ValueFormatters;
  readonly dirty: number;
  readonly hoveredRowIndex: number | null;
  readonly dragState: ActiveOrderDrag | null;
  readonly clustersScroll: ClustersScrollState;
}

/** Поставщик bitmap-шрифтов для элементов. */
export interface FontProvider {
  /** Возвращает имя fontFamily установленного bitmap-шрифта для указанного размера. */
  getFontFamily(fontSize: number): string;
  /** Измеряет ширину текста для указанного размера шрифта. */
  measureTextWidth(text: string, fontSize: number): number;
}

/** Область попадания индикатора заявок (для hit-testing в фасаде). */
export interface OrderIndicatorHitArea {
  x: number;
  y: number;
  width: number;
  height: number;
  rowIndex: number;
  orders: CurrentOrderDisplay[];
  hasDirtyOrders: boolean;
}

/**
 * События рендера. Реализуются кодом вне отрисовки (Angular частью виджета).
 * Рендер не выставляет заявки сам - он только сообщает о действиях пользователя.
 */
export interface ScalperOrderBook2RendererEvents {
  /** Нажатие кнопки мыши на строке стакана (не на индикаторе заявок). */
  rowMouseDown(e: MouseEvent, row: BodyRow): void;
  /** Клик по индикатору заявок (отмена заявок). */
  orderIndicatorClick(orders: CurrentOrderDisplay[]): void;
  /** Завершение перетаскивания заявок на другую строку. */
  ordersDropped(orders: CurrentOrderDisplay[], targetRow: BodyRow): void;
  /** Смена строки под курсором. */
  hoverChanged(hover: HoveredRowInfo | null): void;
  /** Изменение диапазона видимых строк. */
  visibleRangeChanged(range: VisibleRange | null): void;
  /** Изменение размера области отрисовки. */
  viewportSizeChanged(size: { width: number, height: number }): void;
  /** Прокрутка приблизилась к краю списка строк. */
  scrollEdgeReached(edge: 'top' | 'bottom'): void;
  /** Курсор вошел/покинул секцию таблицы стакана. */
  tablePointerInsideChanged(isInside: boolean): void;
  /** Запрошено контекстное меню панели кластеров. */
  clustersContextMenuRequested(e: MouseEvent): void;
  /** Двойной клик по секции. */
  panelDoubleClicked(panelId: RenderPanelId): void;
}
