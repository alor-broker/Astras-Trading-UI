import {
  Container,
  Graphics
} from 'pixi.js';
import {
  BodyRow,
  CurrentOrderDisplay
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  TradesPanelSettings,
  TradesClusterHighlightMode,
  VolumeHighlightMode
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {TradesCluster} from '@terminal-widgets-lib/widgets/scalper-order-book/types/trades-clusters.types';
import {InstrumentTradesItem} from '@terminal-core-lib/features/instruments/services/instrument-trades-service.types';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {
  ActiveOrderDrag,
  ClustersDisplaySettings,
  ClustersScrollState,
  ComputedLayout,
  DirtyFlags,
  FrameContext,
  HoveredRowInfo,
  OrderIndicatorHitArea,
  OwnTradeDisplay,
  PanelRect,
  RenderLayoutSettings,
  RenderModelState,
  RenderPanelId,
  RenderThemeColors,
  ResolvedTheme,
  ScalperOrderBook2RendererEvents,
  TableDisplaySettings,
  VisibleRange
} from './render-contracts';
import {
  RenderSurface,
  SharedRenderEngine
} from './shared-render-engine';
import {
  DEFAULT_PANEL_WIDTHS,
  LayoutHelper
} from './layout-helper';
import {ViewportController} from './viewport-controller';
import {ColorHelper} from './color-helper';
import {SharedFontProvider} from './font-provider';
import {FormatHelper} from './format-helper';
import {RenderElement} from './elements/render-element';
import {RowBackgroundsElement} from './elements/row-backgrounds-element';
import {TableGridElement} from './elements/table-grid-element';
import {VolumeColumnElement} from './elements/volume-column-element';
import {PriceColumnElement} from './elements/price-column-element';
import {OrdersColumnElement} from './elements/orders-column-element';
import {TradesPanelElement} from './elements/trades-panel-element';
import {ClustersPanelElement} from './elements/clusters-panel-element';

/** Количество строк до края, при котором запрашивается расширение ценового ряда. */
const SCROLL_EDGE_BUFFER_ROWS = 10;

/** Минимальная ширина колонки кластера в px (как в DOM версии). */
const MIN_CLUSTER_COLUMN_WIDTH = 25;

/** Смещение мыши, после которого нажатие на индикатор заявок считается перетаскиванием. */
const DRAG_START_THRESHOLD_PX = 4;

const DEFAULT_THEME: RenderThemeColors = {
  buyColor: 'rgba(0,155,99,1)',
  sellColor: 'rgba(209,38,27,1)',
  mixColor: 'rgba(128,91,0,1)',
  buyColorBackground: 'rgba(0,155,99,0.4)',
  sellColorBackground: 'rgba(209,38,27,0.4)',
  buyColorBackgroundLight: 'rgba(0,155,99,1)',
  buyColorAccent: 'rgba(19,219,146,1)',
  sellColorAccent: 'rgba(255,69,0,1)',
  buySellBtnTextColor: 'white',
  componentBackground: 'rgba(20,24,31,1)',
  primaryColor: 'rgba(23,125,220,1)',
  textColor: 'rgba(255,255,255,0.85)',
  textMaxContrastColor: 'white',
  tableGridColor: '#272E3B',
  tableBorderColor: '#272E3B',
  disabledColor: 'rgba(255,255,255,0.3)',
  warningColor: '#d9a31c'
};

interface PendingOrderInteraction {
  orders: CurrentOrderDisplay[];
  rowIndex: number;
  startX: number;
  startY: number;
  hasDirtyOrders: boolean;
  isDragging: boolean;
}

/**
 * Фасад отрисовки скальперского стакана на pixi.js.
 *
 * Полностью изолирован от Angular: получает данные через сеттеры,
 * сообщает о действиях пользователя через колбэки ScalperOrderBook2RendererEvents.
 * Не содержит rxjs подписок и не выставляет заявки.
 *
 * Отрисовка выполняется общим движком SharedRenderEngine не чаще частоты
 * обновления экрана и только при изменении данных (dirty flags).
 */
export class ScalperOrderBook2Renderer implements RenderSurface {
  private readonly engine = SharedRenderEngine.getInstance();

  private readonly canvas: HTMLCanvasElement;

  private readonly canvasCtx: CanvasRenderingContext2D;

  private readonly stage = new Container();

  private readonly viewport = new ViewportController();

  private readonly fonts = SharedFontProvider.getInstance();

  private formatters: FormatHelper;

  private readonly model: RenderModelState;

  private theme: ResolvedTheme = ColorHelper.resolveTheme(DEFAULT_THEME);

  private layoutSettings: RenderLayoutSettings = {
    widths: {...DEFAULT_PANEL_WIDTHS},
    showTradesPanel: true,
    showClustersPanel: true
  };

  private computedLayout: ComputedLayout | null = null;

  private dirty: number = DirtyFlags.None;

  private destroyed = false;

  private resizeObserver: ResizeObserver | null = null;

  private hoveredRowIndex: number | null = null;

  private dragState: ActiveOrderDrag | null = null;

  private pendingOrderInteraction: PendingOrderInteraction | null = null;

  private clustersScrollOffset = 0;

  private clustersAutoScroll = true;

  private clustersDragLastX: number | null = null;

  private lastClustersPanelWidth = 0;

  private lastCanvasStyleWidth = -1;

  private lastCanvasStyleHeight = -1;

  private lastCursor = '';

  private rowsVersion = 0;

  private readonly edgeNotifiedVersion: Record<'top' | 'bottom', number> = {top: -1, bottom: -1};

  private lastEmittedRange: VisibleRange | null = null;

  private lastEmittedHoverIndex: number | null = null;

  private isPointerInsideTable = false;

  // Контейнеры секций. Содержимое маскируется границами секции.
  private readonly clustersPanelContainer = new Container();

  private readonly tradesPanelContainer = new Container();

  private readonly tablePanelContainer = new Container();

  private readonly clustersPanelMask = new Graphics();

  private readonly tradesPanelMask = new Graphics();

  private readonly tablePanelMask = new Graphics();

  private readonly tableElements: RenderElement[];

  private readonly tradesElements: RenderElement[];

  private readonly clustersElements: RenderElement[];

  private readonly ordersColumnElement: OrdersColumnElement;

  private readonly listeners: { type: string, handler: (e: Event) => void }[] = [];

  private constructor(
    private readonly host: HTMLElement,
    private readonly events: ScalperOrderBook2RendererEvents
  ) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '0';
    this.canvas.style.top = '0';
    this.canvas.style.touchAction = 'none';
    this.host.appendChild(this.canvas);

    const ctx2d = this.canvas.getContext('2d');
    if (ctx2d == null) {
      throw new Error('Failed to create 2d canvas context');
    }

    this.canvasCtx = ctx2d;

    this.formatters = new FormatHelper('ru');

    this.model = {
      rows: [],
      orders: [],
      trades: [],
      ownTrades: [],
      clusters: [],
      displaySettings: {
        volumeHighlightMode: VolumeHighlightMode.BiggestVolume,
        volumeHighlightOptions: [],
        volumeHighlightFullness: 10000,
        volumeDisplayFormat: NumberDisplayFormat.Default,
        priceDecimalsCount: null,
        locale: 'ru'
      },
      tradesPanelSettings: {
        minTradeVolumeFilter: 0,
        hideFilteredTrades: false,
        tradesAggregationPeriodMs: 0,
        showOwnTrades: false
      },
      clustersSettings: {
        volumeDisplayFormat: NumberDisplayFormat.LetterSuffix,
        highlightMode: TradesClusterHighlightMode.Off,
        targetVolume: null,
        displayIntervalsCount: 5
      },
      showGrowingVolume: false
    };

    this.stage.eventMode = 'none';

    this.clustersPanelContainer.mask = this.clustersPanelMask;
    this.tradesPanelContainer.mask = this.tradesPanelMask;
    this.tablePanelContainer.mask = this.tablePanelMask;

    this.stage.addChild(this.clustersPanelMask);
    this.stage.addChild(this.tradesPanelMask);
    this.stage.addChild(this.tablePanelMask);
    this.stage.addChild(this.clustersPanelContainer);
    this.stage.addChild(this.tradesPanelContainer);
    this.stage.addChild(this.tablePanelContainer);

    const rowBackgrounds = new RowBackgroundsElement();
    const tableGrid = new TableGridElement();
    const volumeColumn = new VolumeColumnElement();
    const priceColumn = new PriceColumnElement();
    this.ordersColumnElement = new OrdersColumnElement();

    this.tableElements = [rowBackgrounds, tableGrid, volumeColumn, priceColumn, this.ordersColumnElement];
    this.tableElements.forEach(e => this.tablePanelContainer.addChild(e.container));

    const tradesPanel = new TradesPanelElement();
    this.tradesElements = [tradesPanel];
    this.tradesElements.forEach(e => this.tradesPanelContainer.addChild(e.container));

    const clustersPanel = new ClustersPanelElement();
    this.clustersElements = [clustersPanel];
    this.clustersElements.forEach(e => this.clustersPanelContainer.addChild(e.container));

    this.initDomListeners();
    this.initResizeObserver();
  }

  /** Создает рендер и инициализирует общий движок. */
  static async create(
    host: HTMLElement,
    events: ScalperOrderBook2RendererEvents
  ): Promise<ScalperOrderBook2Renderer> {
    const renderer = new ScalperOrderBook2Renderer(host, events);
    renderer.engine.register(renderer);
    await renderer.engine.init();

    renderer.markDirty(DirtyFlags.All);

    return renderer;
  }

  // ------------------------------------------------------------------
  // Входные данные (вызываются кодом потока данных)
  // ------------------------------------------------------------------

  setRows(rows: BodyRow[]): void {
    const hadRows = this.model.rows.length > 0;

    this.model.rows = rows;
    this.rowsVersion++;
    this.viewport.setRows(rows);

    if (this.hoveredRowIndex != null && this.hoveredRowIndex >= rows.length) {
      this.hoveredRowIndex = null;
    }

    // Первое появление строк: центрируемся на стартовой строке ценового ряда,
    // не дожидаясь внешнего выравнивания.
    if (!hadRows && rows.length > 0) {
      const startRowIndex = rows.findIndex(r => r.isStartRow);
      if (startRowIndex >= 0) {
        this.viewport.centerOnIndex(startRowIndex, rows, false);
      }
    }

    this.markDirty(DirtyFlags.Rows | DirtyFlags.Viewport);
  }

  setOrders(orders: CurrentOrderDisplay[]): void {
    this.model.orders = orders;
    this.markDirty(DirtyFlags.Orders);
  }

  setTrades(trades: InstrumentTradesItem[]): void {
    this.model.trades = trades;
    this.markDirty(DirtyFlags.Trades);
  }

  setOwnTrades(trades: OwnTradeDisplay[]): void {
    this.model.ownTrades = trades;
    this.markDirty(DirtyFlags.OwnTrades);
  }

  setClusters(clusters: TradesCluster[]): void {
    this.model.clusters = clusters;
    this.markDirty(DirtyFlags.Clusters | DirtyFlags.ClustersScroll);
  }

  setTheme(colors: RenderThemeColors): void {
    this.theme = ColorHelper.resolveTheme(colors);
    this.markDirty(DirtyFlags.Theme);
  }

  setGridSettings(settings: { rowHeight: number, fontSize: number }): void {
    this.viewport.setGridSettings(settings.rowHeight, settings.fontSize);
    this.markDirty(DirtyFlags.Viewport | DirtyFlags.Settings);
  }

  setDisplaySettings(settings: TableDisplaySettings): void {
    if (settings.locale !== this.model.displaySettings.locale) {
      this.formatters = new FormatHelper(settings.locale);
    }

    this.model.displaySettings = settings;
    this.markDirty(DirtyFlags.Settings);
  }

  setTradesPanelSettings(settings: TradesPanelSettings): void {
    this.model.tradesPanelSettings = settings;
    this.markDirty(DirtyFlags.Settings | DirtyFlags.Trades);
  }

  setClustersPanelSettings(settings: ClustersDisplaySettings): void {
    this.model.clustersSettings = settings;
    this.markDirty(DirtyFlags.Settings | DirtyFlags.Clusters | DirtyFlags.ClustersScroll);
  }

  setLayout(settings: RenderLayoutSettings): void {
    this.layoutSettings = settings;
    this.computedLayout = null;
    this.markDirty(DirtyFlags.Layout | DirtyFlags.ClustersScroll);
  }

  setGrowingVolumeVisible(visible: boolean): void {
    this.model.showGrowingVolume = visible;
    this.markDirty(DirtyFlags.Settings);
  }

  /** Центрирует строку с указанным индексом в видимой области. */
  centerOnRowIndex(index: number, animate: boolean): void {
    this.viewport.centerOnIndex(index, this.model.rows, animate);
    this.markDirty(DirtyFlags.Viewport);
  }

  getViewportSize(): { width: number, height: number } {
    const metrics = this.viewport.metrics;
    return {width: metrics.width, height: metrics.height};
  }

  destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;

    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    for (const listener of this.listeners) {
      this.canvas.removeEventListener(listener.type, listener.handler);
    }
    this.listeners.length = 0;

    this.engine.unregister(this);

    [...this.tableElements, ...this.tradesElements, ...this.clustersElements]
      .forEach(e => e.destroy());

    this.stage.destroy({children: true});
    this.canvas.remove();
  }

  // ------------------------------------------------------------------
  // RenderSurface
  // ------------------------------------------------------------------

  prepareFrame(): { stage: Container, width: number, height: number } | null {
    if (this.destroyed) {
      return null;
    }

    const isAnimating = this.viewport.advanceAnimation(this.model.rows);
    if (isAnimating) {
      this.dirty |= DirtyFlags.Viewport;
    }

    const metrics = this.viewport.metrics;
    if (metrics.width <= 0 || metrics.height <= 0) {
      this.dirty = DirtyFlags.None;
      return null;
    }

    // Геометрия зависит не только от настроек компоновки: ширина колонки цены
    // подстраивается под видимые значения цен (Rows/Viewport) и шрифт (Settings).
    const isLayoutDirty = (this.dirty & (DirtyFlags.Layout | DirtyFlags.Rows | DirtyFlags.Settings | DirtyFlags.Viewport)) !== 0;
    if (isLayoutDirty) {
      this.computedLayout = null;
    }

    const layout = this.getComputedLayout();

    if (isLayoutDirty) {
      this.updatePanelMasks(layout, metrics.height);
    }

    if (isLayoutDirty || (this.dirty & (DirtyFlags.Clusters | DirtyFlags.ClustersScroll)) !== 0) {
      this.updateClustersScrollState(layout);
    }

    const visibleRange = this.viewport.getVisibleRange();
    this.emitRangeEvents(visibleRange);

    const ctx: FrameContext = {
      model: this.model,
      viewport: metrics,
      layout,
      theme: this.theme,
      visibleRange,
      fonts: this.fonts,
      formatters: this.formatters,
      dirty: this.dirty,
      hoveredRowIndex: this.hoveredRowIndex,
      dragState: this.dragState,
      clustersScroll: this.getClustersScrollState(layout)
    };

    for (const element of this.tableElements) {
      if ((this.dirty & element.interestMask) !== 0) {
        element.update(ctx);
      }
    }

    for (const element of this.tradesElements) {
      if ((this.dirty & element.interestMask) !== 0) {
        element.update(ctx);
      }
    }

    for (const element of this.clustersElements) {
      if ((this.dirty & element.interestMask) !== 0) {
        element.update(ctx);
      }
    }

    this.dirty = DirtyFlags.None;

    if (isAnimating) {
      // Продолжаем анимацию в следующем кадре.
      this.engine.requestFrame(this);
    }

    return {
      stage: this.stage,
      width: metrics.width,
      height: metrics.height
    };
  }

  /** Перерисовывает виджет при смене разрешения отрисовки (devicePixelRatio). */
  resolutionChanged(): void {
    this.markDirty(DirtyFlags.All);
  }

  presentFrame(source: HTMLCanvasElement, width: number, height: number, resolution: number): void {
    if (this.destroyed) {
      return;
    }

    const deviceWidth = Math.round(width * resolution);
    const deviceHeight = Math.round(height * resolution);

    if (this.canvas.width !== deviceWidth) {
      this.canvas.width = deviceWidth;
    }

    if (this.canvas.height !== deviceHeight) {
      this.canvas.height = deviceHeight;
    }

    if (this.lastCanvasStyleWidth !== width) {
      this.lastCanvasStyleWidth = width;
      this.canvas.style.width = `${width}px`;
    }

    if (this.lastCanvasStyleHeight !== height) {
      this.lastCanvasStyleHeight = height;
      this.canvas.style.height = `${height}px`;
    }

    this.canvasCtx.clearRect(0, 0, deviceWidth, deviceHeight);
    this.canvasCtx.drawImage(
      source,
      0,
      0,
      deviceWidth,
      deviceHeight,
      0,
      0,
      deviceWidth,
      deviceHeight
    );
  }

  // ------------------------------------------------------------------
  // Внутренняя логика
  // ------------------------------------------------------------------

  private markDirty(flags: number): void {
    if (this.destroyed) {
      return;
    }

    this.dirty |= flags;
    this.engine.requestFrame(this);
  }

  private initResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(entries => {
      const entry = entries[entries.length - 1] as ResizeObserverEntry | undefined;
      if (entry == null) {
        return;
      }

      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);

      this.viewport.setSize(width, height);
      this.computedLayout = null;
      this.markDirty(DirtyFlags.Viewport | DirtyFlags.Layout | DirtyFlags.ClustersScroll);

      this.events.viewportSizeChanged({width, height});
    });

    this.resizeObserver.observe(this.host);
  }

  private addListener<K extends keyof HTMLElementEventMap>(
    type: K,
    handler: (e: HTMLElementEventMap[K]) => void
  ): void {
    const wrapped = handler as (e: Event) => void;
    this.canvas.addEventListener(type, wrapped);
    this.listeners.push({type, handler: wrapped});
  }

  private initDomListeners(): void {
    this.addListener('pointerdown', e => this.onPointerDown(e));
    this.addListener('pointermove', e => this.onPointerMove(e));
    this.addListener('pointerup', e => this.onPointerUp(e));
    this.addListener('pointerleave', () => this.onPointerLeave());
    this.addListener('wheel', e => this.onWheel(e));
    this.addListener('dblclick', e => this.onDoubleClick(e));
    this.addListener('contextmenu', e => this.onContextMenu(e));
  }

  private onPointerDown(e: PointerEvent): void {
    if (this.destroyed) {
      return;
    }

    const point = this.getLocalPoint(e);
    const layout = this.getComputedLayout();

    // Нажатие на индикатор заявок: подготовка к отмене (клик) или переносу (drag).
    if (e.button === 0) {
      const hitArea = this.findOrderHitArea(point.x, point.y);
      if (hitArea != null) {
        this.pendingOrderInteraction = {
          orders: hitArea.orders,
          rowIndex: hitArea.rowIndex,
          startX: point.x,
          startY: point.y,
          hasDirtyOrders: hitArea.hasDirtyOrders,
          isDragging: false
        };

        this.canvas.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
    }

    // Горизонтальная прокрутка панели кластеров.
    if (e.button === 0 && this.isInPanel(point.x, layout.clusters)) {
      const scroll = this.getClustersScrollState(layout);
      if (scroll.totalWidth > (layout.clusters?.width ?? 0)) {
        this.clustersDragLastX = point.x;
        this.canvas.setPointerCapture(e.pointerId);
      }

      e.preventDefault();
      return;
    }

    // Торговые действия по строкам таблицы.
    // Колонка заявок не участвует: в ней нажатия вне индикаторов игнорируются
    // (как в DOM версии), чтобы исключить случайное выставление заявки.
    if (this.isInPanel(point.x, layout.table)) {
      const tableLocalX = point.x - layout.table.x;
      if (tableLocalX < layout.tableColumns.orders.x) {
        const rowIndex = this.viewport.getRowIndexByY(point.y);
        if (rowIndex != null && rowIndex < this.model.rows.length) {
          this.events.rowMouseDown(e, this.model.rows[rowIndex]);
        }
      }

      e.preventDefault();
      document.getSelection()?.removeAllRanges();
    }
  }

  private onPointerMove(e: PointerEvent): void {
    if (this.destroyed) {
      return;
    }

    const point = this.getLocalPoint(e);
    const layout = this.getComputedLayout();

    // Перетаскивание индикатора заявок.
    const pending = this.pendingOrderInteraction;
    if (pending != null) {
      if (!pending.isDragging) {
        const distance = Math.max(
          Math.abs(point.x - pending.startX),
          Math.abs(point.y - pending.startY)
        );

        if (distance >= DRAG_START_THRESHOLD_PX && !pending.hasDirtyOrders) {
          pending.isDragging = true;
        }
      }

      if (pending.isDragging) {
        const rowIndex = this.viewport.getRowIndexByY(point.y);
        if (rowIndex != null) {
          this.dragState = {
            orders: pending.orders,
            sourceRowIndex: pending.rowIndex,
            currentRowIndex: rowIndex
          };

          this.markDirty(DirtyFlags.Drag);
        }
      }

      return;
    }

    // Прокрутка кластеров перетаскиванием.
    if (this.clustersDragLastX != null) {
      const movement = point.x - this.clustersDragLastX;
      this.clustersDragLastX = point.x;
      this.applyClustersScroll(-movement, layout);
      return;
    }

    this.updateHover(point.x, point.y, layout);
  }

  private onPointerUp(e: PointerEvent): void {
    if (this.destroyed) {
      return;
    }

    const point = this.getLocalPoint(e);

    const pending = this.pendingOrderInteraction;
    if (pending != null) {
      this.pendingOrderInteraction = null;

      if (pending.isDragging) {
        const rowIndex = this.viewport.getRowIndexByY(point.y);
        this.dragState = null;
        this.markDirty(DirtyFlags.Drag);

        if (rowIndex != null && rowIndex < this.model.rows.length) {
          this.events.ordersDropped(pending.orders, this.model.rows[rowIndex]);
        }
      } else if (e.button === 0) {
        this.events.orderIndicatorClick(pending.orders);
      }

      return;
    }

    this.clustersDragLastX = null;
  }

  private onPointerLeave(): void {
    this.clustersDragLastX = null;
    this.updateHover(-1, -1, this.getComputedLayout());
  }

  private onWheel(e: WheelEvent): void {
    if (this.destroyed) {
      return;
    }

    e.preventDefault();

    const delta = e.deltaMode === WheelEvent.DOM_DELTA_LINE
      ? e.deltaY * this.viewport.metrics.rowHeight
      : e.deltaY;

    this.viewport.scrollBy(delta, this.model.rows);
    this.markDirty(DirtyFlags.Viewport);

    const point = this.getLocalPoint(e);
    this.updateHover(point.x, point.y, this.getComputedLayout());
  }

  private onDoubleClick(e: MouseEvent): void {
    const point = this.getLocalPoint(e);
    const layout = this.getComputedLayout();

    if (this.isInPanel(point.x, layout.clusters)) {
      this.events.panelDoubleClicked(RenderPanelId.TradeClusters);
    } else if (this.isInPanel(point.x, layout.trades)) {
      this.events.panelDoubleClicked(RenderPanelId.Trades);
    }

    e.preventDefault();
  }

  private onContextMenu(e: MouseEvent): void {
    e.preventDefault();

    const point = this.getLocalPoint(e);
    const layout = this.getComputedLayout();

    if (this.isInPanel(point.x, layout.clusters)) {
      this.events.clustersContextMenuRequested(e);
    }
  }

  private getLocalPoint(e: MouseEvent): { x: number, y: number } {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  private isInPanel(x: number, panel: PanelRect | null): boolean {
    return panel != null && x >= panel.x && x < panel.x + panel.width;
  }

  private findOrderHitArea(x: number, y: number): OrderIndicatorHitArea | null {
    for (const area of this.ordersColumnElement.hitAreas) {
      if (x >= area.x && x <= area.x + area.width && y >= area.y && y <= area.y + area.height) {
        return area;
      }
    }

    return null;
  }

  private updateHover(x: number, y: number, layout: ComputedLayout): void {
    const isInsideTable = this.isInPanel(x, layout.table);
    if (isInsideTable !== this.isPointerInsideTable) {
      this.isPointerInsideTable = isInsideTable;
      this.events.tablePointerInsideChanged(isInsideTable);
    }

    // Индикаторы заявок кликабельны - показываем pointer.
    const cursor = this.findOrderHitArea(x, y) != null ? 'pointer' : '';
    if (cursor !== this.lastCursor) {
      this.lastCursor = cursor;
      this.canvas.style.cursor = cursor;
    }

    const isHoverablePanel = isInsideTable || this.isInPanel(x, layout.clusters);

    let newHoverIndex: number | null = null;
    if (isHoverablePanel && y >= 0 && y <= this.viewport.metrics.height) {
      newHoverIndex = this.viewport.getRowIndexByY(y);
      if (newHoverIndex != null && newHoverIndex >= this.model.rows.length) {
        newHoverIndex = null;
      }
    }

    if (newHoverIndex !== this.hoveredRowIndex) {
      this.hoveredRowIndex = newHoverIndex;
      this.markDirty(DirtyFlags.Hover);
    }

    if (newHoverIndex !== this.lastEmittedHoverIndex) {
      this.lastEmittedHoverIndex = newHoverIndex;
      this.events.hoverChanged(this.getHoveredRowInfo());
    }
  }

  private getHoveredRowInfo(): HoveredRowInfo | null {
    if (this.hoveredRowIndex == null || this.hoveredRowIndex >= this.model.rows.length) {
      return null;
    }

    return {
      rowIndex: this.hoveredRowIndex,
      price: this.model.rows[this.hoveredRowIndex].price,
      y: this.viewport.getRowY(this.hoveredRowIndex)
    };
  }

  private emitRangeEvents(range: VisibleRange | null): void {
    const last = this.lastEmittedRange;
    const isChanged = (range == null) !== (last == null)
      || (range != null && last != null && (range.start !== last.start || range.end !== last.end));

    if (isChanged) {
      this.lastEmittedRange = range;
      this.events.visibleRangeChanged(range);
    }

    if (range == null || this.model.rows.length === 0) {
      return;
    }

    if (range.start < SCROLL_EDGE_BUFFER_ROWS && this.edgeNotifiedVersion.top !== this.rowsVersion) {
      this.edgeNotifiedVersion.top = this.rowsVersion;
      this.events.scrollEdgeReached('top');
    }

    if ((this.model.rows.length - 1 - range.end) < SCROLL_EDGE_BUFFER_ROWS
      && this.edgeNotifiedVersion.bottom !== this.rowsVersion) {
      this.edgeNotifiedVersion.bottom = this.rowsVersion;
      this.events.scrollEdgeReached('bottom');
    }
  }

  private getComputedLayout(): ComputedLayout {
    if (this.computedLayout != null) {
      return this.computedLayout;
    }

    const width = Math.max(0, this.viewport.metrics.width);
    const rects = LayoutHelper.computePanelRects(this.layoutSettings, width);

    this.computedLayout = {
      clusters: rects.clusters,
      trades: rects.trades,
      table: rects.table,
      tableColumns: this.computeTableColumns(rects.table.width)
    };

    return this.computedLayout;
  }

  private computeTableColumns(tableWidth: number): { volume: PanelRect, price: PanelRect, orders: PanelRect } {
    const fontSize = this.viewport.metrics.fontSize;

    // Оценка ширины колонки цены по самой длинной видимой цене.
    let priceSample = '0000.00';
    const range = this.viewport.getVisibleRange();
    if (range != null && this.model.rows.length > 0) {
      let maxLength = 0;
      for (let i = range.start; i <= range.end && i < this.model.rows.length; i++) {
        const formatted = this.formatters.formatPrice(
          this.model.rows[i].price,
          this.model.displaySettings.priceDecimalsCount
        );

        if (formatted.length > maxLength) {
          maxLength = formatted.length;
          priceSample = formatted;
        }
      }
    }

    const pricePadding = 16;
    const priceWidth = Math.min(
      Math.ceil(this.fonts.measureTextWidth(priceSample, fontSize)) + pricePadding,
      Math.max(40, tableWidth * 0.4)
    );

    const ordersWidth = Math.max(20, Math.min(tableWidth * 0.25, 90));
    const volumeWidth = Math.max(0, tableWidth - priceWidth - ordersWidth);

    return {
      volume: {x: 0, width: volumeWidth},
      price: {x: volumeWidth, width: priceWidth},
      orders: {x: volumeWidth + priceWidth, width: ordersWidth}
    };
  }

  private updatePanelMasks(layout: ComputedLayout, height: number): void {
    const updateMask = (mask: Graphics, panel: PanelRect | null): void => {
      mask.clear();
      if (panel != null && panel.width > 0) {
        mask.rect(panel.x, 0, panel.width, height).fill(0xffffff);
      }
    };

    updateMask(this.clustersPanelMask, layout.clusters);
    updateMask(this.tradesPanelMask, layout.trades);
    updateMask(this.tablePanelMask, layout.table);

    this.clustersPanelContainer.x = layout.clusters?.x ?? 0;
    this.clustersPanelContainer.visible = layout.clusters != null;
    this.tradesPanelContainer.x = layout.trades?.x ?? 0;
    this.tradesPanelContainer.visible = layout.trades != null;
    this.tablePanelContainer.x = layout.table.x;
  }

  private getClustersScrollState(layout: ComputedLayout): ClustersScrollState {
    const panelWidth = layout.clusters?.width ?? 0;
    const intervalsCount = Math.max(1, this.model.clustersSettings.displayIntervalsCount);
    const columnWidth = Math.max(MIN_CLUSTER_COLUMN_WIDTH, panelWidth / intervalsCount);
    const totalWidth = columnWidth * intervalsCount;

    return {
      offset: this.clustersScrollOffset,
      columnWidth,
      totalWidth
    };
  }

  private updateClustersScrollState(layout: ComputedLayout): void {
    const panelWidth = layout.clusters?.width ?? 0;
    const scroll = this.getClustersScrollState(layout);
    const maxOffset = Math.max(0, scroll.totalWidth - panelWidth);

    // При сужении панели автопрокрутка включается заново (как в DOM версии).
    if (panelWidth < this.lastClustersPanelWidth) {
      this.clustersAutoScroll = true;
    }

    this.lastClustersPanelWidth = panelWidth;

    if (this.clustersAutoScroll) {
      this.clustersScrollOffset = maxOffset;
    } else {
      this.clustersScrollOffset = Math.min(Math.max(0, this.clustersScrollOffset), maxOffset);
    }
  }

  private applyClustersScroll(delta: number, layout: ComputedLayout): void {
    const panelWidth = layout.clusters?.width ?? 0;
    const scroll = this.getClustersScrollState(layout);
    const maxOffset = Math.max(0, scroll.totalWidth - panelWidth);

    this.clustersScrollOffset = Math.min(Math.max(0, this.clustersScrollOffset + delta), maxOffset);
    this.clustersAutoScroll = this.clustersScrollOffset >= maxOffset;

    this.markDirty(DirtyFlags.ClustersScroll);
  }
}
