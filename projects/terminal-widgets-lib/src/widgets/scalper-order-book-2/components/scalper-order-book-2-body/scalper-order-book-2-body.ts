import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  DOCUMENT,
  ElementRef,
  inject,
  input,
  NgZone,
  OnDestroy,
  OnInit,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  fromEvent,
  interval,
  NEVER,
  Observable,
  shareReplay,
  take,
  takeUntil,
  withLatestFrom
} from 'rxjs';
import {
  finalize,
  map,
  switchMap,
  tap
} from 'rxjs/operators';
import {ListRange} from '@angular/cdk/collections';
import {
  CdkDrag,
  CdkDragEnd,
  Point
} from '@angular/cdk/drag-drop';
import {LetDirective} from '@ngrx/component';
import {AsyncPipe} from '@angular/common';
import {TranslocoDirective} from '@jsverse/transloco';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {NzDropdownMenuComponent} from 'ng-zorro-antd/dropdown';
import {
  NzMenuDirective,
  NzMenuGroupComponent,
  NzMenuItemComponent
} from 'ng-zorro-antd/menu';
import {NzIconDirective} from 'ng-zorro-antd/icon';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {InstrumentTradesService} from '@terminal-core-lib/features/instruments/services/instrument-trades.service';
import {WidgetLocalStateService} from '@terminal-core-lib/features/widget-local-state/widget-local-state.service';
import {Side} from '@terminal-core-lib/common/types/side.types';
import {ContentSize} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes
} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {
  InstrumentEqualityComparer,
  InstrumentKeyHelper
} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {ContextMenuService} from '@terminal-core-lib/common/services/context-menu.service';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {PriceRow} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  PriceUnits,
  ScalperOrderBookWidgetSettings,
  TradesClusterPanelSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {PriceRowsStore} from '@terminal-widgets-lib/widgets/scalper-order-book/utils/price-rows-store';
import {DataContextBuilder} from '@terminal-widgets-lib/widgets/scalper-order-book/utils/data-context-builder';
import {ScalperOrderBookDataProvider} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-data-provider.service';
import {ScalperHotKeyCommandService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-hot-key-command.service';
import {ScalperOrderBookSettingsWriteService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-order-book-settings-write.service';
import {SCALPER_ORDERBOOK_SHARED_CONTEXT} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book/scalper-order-book';
import {TopPanel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/top-panel/top-panel';
import {TopFloatingPanel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/top-floating-panel/top-floating-panel';
import {BottomFloatingPanel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/bottom-floating-panel/bottom-floating-panel';
import {LimitOrdersVolumeIndicator} from '@terminal-widgets-lib/widgets/scalper-order-book/components/limit-orders-volume-indicator/limit-orders-volume-indicator';
import {OrdersIndicator} from '@terminal-widgets-lib/widgets/scalper-order-book/components/orders-indicator/orders-indicator';
import {PossibleActionsPanel} from '@terminal-widgets-lib/widgets/scalper-order-book/components/possible-actions-panel/possible-actions-panel';
import {TradesClusterPanelSettingsDefaults} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book-settings/constants/settings-defaults';
import {
  ScalperOrderBook2Surface,
  SurfaceEventSinks
} from '@terminal-widgets-lib/widgets/scalper-order-book-2/components/scalper-order-book-2-surface/scalper-order-book-2-surface';
import {
  HoveredRowInfo,
  RenderPanelId
} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/render-contracts';
import {LayoutHelper} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/layout-helper';

interface ScaleState {
  scaleFactor: number;
}

interface ResizeHandleView {
  leftPanelId: RenderPanelId;
  x: number;
}

interface RulerMarkerView {
  y: number;
  rowHeight: number;
  text: string;
  left: number;
  isLeftSide: boolean;
}

/** Ширина, резервируемая под маркер линейки слева от таблицы. */
const RULER_MARKER_RESERVED_WIDTH = 150;

/**
 * Тело виджета: владеет data context и состоянием компоновки,
 * размещает поверхность pixi отрисовки и HTML оверлеи
 * (верхняя панель, плавающие панели, индикаторы, линейка, resize-ручки).
 */
@Component({
  selector: 'ats-scalper-order-book-2-body',
  templateUrl: './scalper-order-book-2-body.html',
  styleUrls: ['./scalper-order-book-2-body.less'],
  providers: [
    PriceRowsStore
  ],
  imports: [
    TopPanel,
    LetDirective,
    NzSpinComponent,
    NzEmptyComponent,
    NzDropdownMenuComponent,
    NzMenuDirective,
    NzMenuGroupComponent,
    NzMenuItemComponent,
    NzIconDirective,
    CdkDrag,
    TranslocoDirective,
    TopFloatingPanel,
    BottomFloatingPanel,
    LimitOrdersVolumeIndicator,
    OrdersIndicator,
    PossibleActionsPanel,
    ScalperOrderBook2Surface,
    AsyncPipe
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperOrderBook2Body implements OnInit, OnDestroy {
  readonly guid = input.required<string>();

  readonly isActive = input(false);

  readonly sides = Side;

  readonly priceUnits = PriceUnits;

  readonly availableTimeframes: number[] = [60, 300, 900, 3600];

  readonly availableIntervalsCount = [1, 2, 5];

  readonly topFloatingPanelPositionStateKey = 'top-floating-panel-position';

  readonly bottomFloatingPanelPositionStateKey = 'bottom-floating-panel-position';

  readonly maxScaleFactor = 10;

  readonly surface = viewChild(ScalperOrderBook2Surface);

  readonly clustersMenu = viewChild(NzDropdownMenuComponent);

  readonly bodyContainer = viewChild<ElementRef<HTMLElement>>('bodyContainer');

  readonly topFloatingPanelContainer = viewChild<ElementRef<HTMLDivElement>>('topFloatingPanelContainer');

  readonly bottomFloatingPanelContainer = viewChild<ElementRef<HTMLDivElement>>('bottomFloatingPanelContainer');

  readonly sinks: SurfaceEventSinks = {
    contentSize$: new BehaviorSubject<ContentSize | null>(null),
    displayRange$: new BehaviorSubject<ListRange | null>(null),
    hoveredRow$: new BehaviorSubject<HoveredRowInfo | null>(null),
    isTableHovered$: new BehaviorSubject<boolean>(false),
    isLoading$: new BehaviorSubject<boolean>(false)
  };

  dataContext!: ScalperOrderBookDataContext;

  widgetSettings$!: Observable<ScalperOrderBookWidgetSettings>;

  hiddenOrdersIndicators$!: Observable<{ up: boolean, down: boolean }>;

  resizeHandles$!: Observable<ResizeHandleView[]>;

  rulerMarker$!: Observable<RulerMarkerView | null>;

  topFloatingPanelPosition$!: Observable<Point>;

  bottomFloatingPanelPosition$!: Observable<Point>;

  private readonly widthsOverride$ = new BehaviorSubject<Record<string, number> | null>(null);

  private readonly scalperOrderBookSharedContext = inject(SCALPER_ORDERBOOK_SHARED_CONTEXT, {skipSelf: true});

  private readonly scalperOrderBookDataProvider = inject(ScalperOrderBookDataProvider);

  private readonly settingsWriteService = inject(ScalperOrderBookSettingsWriteService);

  private readonly priceRowsStore = inject(PriceRowsStore);

  private readonly quotesService = inject(QuotesService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly instrumentTradesService = inject(InstrumentTradesService);

  private readonly hotkeysService = inject(ScalperHotKeyCommandService);

  private readonly widgetLocalStateService = inject(WidgetLocalStateService);

  private readonly contextMenuService = inject(ContextMenuService);

  private readonly documentRef = inject<Document>(DOCUMENT);

  private readonly ngZone = inject(NgZone);

  private readonly destroyRef = inject(DestroyRef);

  private lastContainerHeight = 0;

  private preExpandWidths: Record<string, number> | null = null;

  ngOnInit(): void {
    this.initContext();
    this.initWidgetSettings();
    this.initOverrideResetOnSettingsChange();
    this.initAutoAlign();
    this.initManualAlign();
    this.initScaleChange();
    this.initHiddenOrdersIndicators();
    this.initResizeHandles();
    this.initRulerMarker();

    this.topFloatingPanelPosition$ = this.initFloatingPanelPosition(
      this.topFloatingPanelPositionStateKey,
      () => this.topFloatingPanelContainer()?.nativeElement.getBoundingClientRect() ?? null
    );

    this.bottomFloatingPanelPosition$ = this.initFloatingPanelPosition(
      this.bottomFloatingPanelPositionStateKey,
      () => this.bottomFloatingPanelContainer()?.nativeElement.getBoundingClientRect() ?? null
    );
  }

  ngOnDestroy(): void {
    this.sinks.contentSize$.complete();
    this.sinks.displayRange$.complete();
    this.sinks.hoveredRow$.complete();
    this.sinks.isTableHovered$.complete();
    this.sinks.isLoading$.complete();
    this.widthsOverride$.complete();

    this.dataContext.destroy();
    this.priceRowsStore.ngOnDestroy();
  }

  saveFloatingPanelPosition(event: CdkDragEnd, stateKey: string): void {
    const position = event.source.getFreeDragPosition();
    this.widgetLocalStateService.setStateRecord<Point>(
      this.guid(),
      stateKey,
      position
    );
  }

  showClustersContextMenu(event: MouseEvent): void {
    const menu = this.clustersMenu();
    if (menu == null) {
      return;
    }

    menu.nzOverlayClassName = 'ats-scalper-order-book-2-body';
    this.contextMenuService.create(event, menu, {scrollStrategy: 'noop'});
  }

  setClustersTimeframe(value: number): void {
    this.updateTradesClusterPanelSettings({
      timeframe: value
    });
  }

  setClustersIntervalsCount(value: number): void {
    this.updateTradesClusterPanelSettings({
      displayIntervalsCount: value
    });
  }

  onPanelDoubleClick(panelId: RenderPanelId): void {
    if (panelId !== RenderPanelId.TradeClusters) {
      return;
    }

    this.widgetSettings$.pipe(
      take(1),
      withLatestFrom(this.sinks.contentSize$)
    ).subscribe(([settings, contentSize]) => {
      if (!(settings.showTradesPanel ?? true) || !(settings.showTradesClustersPanel ?? true)) {
        return;
      }

      if (this.preExpandWidths != null) {
        this.applyWidthsOverride(this.preExpandWidths);
        this.preExpandWidths = null;
        return;
      }

      const widths = this.getEffectiveWidthsPercent(settings, contentSize?.width ?? 0);
      this.preExpandWidths = {...widths};

      this.applyWidthsOverride({
        ...widths,
        [RenderPanelId.TradeClusters]: (widths[RenderPanelId.TradeClusters] ?? 0) + (widths[RenderPanelId.Trades] ?? 0),
        [RenderPanelId.Trades]: 0
      });
    });
  }

  startHandleResize(event: MouseEvent, handle: ResizeHandleView): void {
    event.preventDefault();
    event.stopPropagation();

    if (event.button !== 0) {
      return;
    }

    this.preExpandWidths = null;

    this.widgetSettings$.pipe(
      take(1),
      withLatestFrom(this.sinks.contentSize$)
    ).subscribe(([settings, contentSize]) => {
      const containerWidth = contentSize?.width ?? 0;
      if (containerWidth <= 0) {
        return;
      }

      this.ngZone.runOutsideAngular(() => {
        this.documentRef.body.style.cursor = 'col-resize';
      });

      const containerLeft = this.getContainerElement()?.getBoundingClientRect().left ?? 0;

      fromEvent<MouseEvent>(this.documentRef, 'mousemove').pipe(
        tap(e => {
          e.preventDefault();
          e.stopPropagation();
        }),
        map(e => e.clientX - containerLeft),
        takeUntil(fromEvent(this.documentRef, 'mouseup')),
        finalize(() => {
          this.ngZone.runOutsideAngular(() => {
            this.documentRef.body.style.cursor = 'default';
          });

          this.persistCurrentWidths();
        }),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(pointerX => {
        this.resizePanels(settings, containerWidth, handle.leftPanelId, pointerX);
      });
    });
  }

  private getContainerElement(): HTMLElement | null {
    return this.bodyContainer()?.nativeElement ?? null;
  }

  private resizePanels(
    settings: ScalperOrderBookWidgetSettings,
    containerWidth: number,
    leftPanelId: RenderPanelId,
    pointerX: number
  ): void {
    const widths = this.getEffectiveWidthsPercent(settings, containerWidth);
    const rects = LayoutHelper.computePanelRects(
      {
        widths,
        showTradesPanel: settings.showTradesPanel ?? true,
        showClustersPanel: settings.showTradesClustersPanel ?? true
      },
      containerWidth
    );

    const visiblePanels = LayoutHelper.getVisiblePanels({
      widths,
      showTradesPanel: settings.showTradesPanel ?? true,
      showClustersPanel: settings.showTradesClustersPanel ?? true
    });

    const leftIndex = visiblePanels.indexOf(leftPanelId);
    if (leftIndex < 0 || leftIndex >= visiblePanels.length - 1) {
      return;
    }

    const rightPanelId = visiblePanels[leftIndex + 1];

    const panelRects = {
      [RenderPanelId.TradeClusters]: rects.clusters,
      [RenderPanelId.Trades]: rects.trades,
      [RenderPanelId.OrderBookTable]: rects.table
    };

    const leftRect = panelRects[leftPanelId];
    const rightRect = panelRects[rightPanelId];
    if (leftRect == null || rightRect == null) {
      return;
    }

    const minLeft = this.getMinPanelWidth(leftPanelId);
    const minRight = this.getMinPanelWidth(rightPanelId);
    const total = leftRect.width + rightRect.width;

    const newLeftWidth = Math.min(
      Math.max(pointerX - leftRect.x, minLeft),
      Math.max(total - minRight, minLeft)
    );
    const newRightWidth = total - newLeftWidth;

    const updatedWidths: Record<string, number> = {...widths};
    updatedWidths[leftPanelId] = this.roundWidth((newLeftWidth / containerWidth) * 100);
    updatedWidths[rightPanelId] = this.roundWidth((newRightWidth / containerWidth) * 100);

    this.applyWidthsOverride(updatedWidths);
  }

  private getMinPanelWidth(panelId: RenderPanelId): number {
    switch (panelId) {
      case RenderPanelId.OrderBookTable:
        return 75;
      case RenderPanelId.Trades:
        return 40;
      default:
        return 20;
    }
  }

  private roundWidth(value: number): number {
    return Math.floor(value * (10 ** 5)) / (10 ** 5);
  }

  private persistCurrentWidths(): void {
    const widths = this.widthsOverride$.value;
    if (widths == null) {
      return;
    }

    this.widgetSettings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.settingsWriteService.updateInstrumentLinkedSettings(
        {
          layout: {
            ...settings.layout,
            widths
          }
        },
        settings
      );
    });
  }

  private applyWidthsOverride(widths: Record<string, number> | null): void {
    this.widthsOverride$.next(widths);
    this.surface()?.setWidthsOverride(widths);
  }

  private getEffectiveWidthsPercent(settings: ScalperOrderBookWidgetSettings, containerWidth: number): Record<string, number> {
    const override = this.widthsOverride$.value;
    if (override != null) {
      return override;
    }

    const savedWidths = settings.layout?.widths ?? {};
    const rects = LayoutHelper.computePanelRects(
      {
        widths: savedWidths,
        showTradesPanel: settings.showTradesPanel ?? true,
        showClustersPanel: settings.showTradesClustersPanel ?? true
      },
      containerWidth
    );

    if (containerWidth <= 0) {
      return savedWidths;
    }

    const result: Record<string, number> = {};
    if (rects.clusters != null) {
      result[RenderPanelId.TradeClusters] = this.roundWidth((rects.clusters.width / containerWidth) * 100);
    }

    if (rects.trades != null) {
      result[RenderPanelId.Trades] = this.roundWidth((rects.trades.width / containerWidth) * 100);
    }

    result[RenderPanelId.OrderBookTable] = this.roundWidth((rects.table.width / containerWidth) * 100);

    return result;
  }

  private initContext(): void {
    this.dataContext = DataContextBuilder.buildContext(
      {
        widgetGuid: this.guid(),
        bodyStreams: {
          contentSize$: this.sinks.contentSize$,
          rowHeight$: this.scalperOrderBookSharedContext.gridSettings$.pipe(
            map(s => s.rowHeight)
          ),
          scaleFactor$: this.scalperOrderBookSharedContext.scaleFactor$
        },
        contextStreams: {
          displayRange$: this.sinks.displayRange$.asObservable(),
          workingVolume$: this.scalperOrderBookSharedContext.workingVolume$.pipe(
            filter((x): x is number => x != null && x > 0)
          )
        },
        bodyParamsGetters: {
          getVisibleRowsCount: (rowHeight: number) => this.getDisplayRowsCount(rowHeight),
          isFillingByHeightNeeded: (currentRows: PriceRow[], rowHeight: number) => this.isFillingByHeightNeeded(currentRows, rowHeight)
        },
        changeNotifications: {
          priceRowsRegenerationStarted: () => this.sinks.isLoading$.next(true),
          priceRowsRegenerationCompleted: () => {
            this.surface()?.alignTable();
            this.sinks.isLoading$.next(false);
          }
        }
      },
      {
        priceRowsStore: this.priceRowsStore,
        scalperOrderBookDataProvider: this.scalperOrderBookDataProvider,
        quotesService: this.quotesService,
        portfolioSubscriptionsService: this.portfolioSubscriptionsService,
        instrumentTradesService: this.instrumentTradesService
      }
    );
  }

  private initWidgetSettings(): void {
    this.widgetSettings$ = this.dataContext.extendedSettings$.pipe(
      map(x => x.widgetSettings),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private initOverrideResetOnSettingsChange(): void {
    this.widgetSettings$.pipe(
      map(s => JSON.stringify(s.layout?.widths ?? {}) + String(s.showTradesPanel ?? true) + String(s.showTradesClustersPanel ?? true)),
      distinctUntilChanged(),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.preExpandWidths = null;
      this.applyWidthsOverride(null);
    });
  }

  private initAutoAlign(): void {
    this.widgetSettings$.pipe(
      map(x => ({
          enabled: (x.enableAutoAlign ?? true) && (x.autoAlignIntervalSec ?? 0) > 0,
          interval: x.autoAlignIntervalSec ?? 0
        })
      ),
      switchMap(s => s.enabled ? interval(s.interval * 1000) : NEVER),
      filter(() => !this.isActive()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.surface()?.alignTable();
    });
  }

  private initManualAlign(): void {
    this.hotkeysService.commands$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(command => {
      if (command.type === AllOrderBooksHotKeysTypes.centerOrderbookKey) {
        this.surface()?.alignTable();
      }
    });
  }

  private initScaleChange(): void {
    const instrumentKey$ = this.widgetSettings$.pipe(
      distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev, curr)),
      map(s => InstrumentKeyHelper.toInstrumentKey(s)),
      shareReplay({bufferSize: 1, refCount: true})
    );

    const getStorageKey = (instrumentKey: InstrumentKey): string => {
      return `scale_${instrumentKey.exchange}_${instrumentKey.symbol}_${instrumentKey.instrumentGroup}`;
    };

    const setScaleFactor = (scaleFactor: number, instrumentKey: InstrumentKey): void => {
      this.scalperOrderBookSharedContext.setScaleFactor(scaleFactor);
      this.widgetLocalStateService.setStateRecord<ScaleState>(
        this.guid(),
        getStorageKey(instrumentKey),
        {
          scaleFactor
        },
        false
      );
    };

    this.sinks.isTableHovered$.pipe(
      switchMap(isHovered => {
        if (isHovered) {
          return this.hotkeysService.commands$;
        }

        return NEVER;
      }),
      withLatestFrom(this.scalperOrderBookSharedContext.scaleFactor$, instrumentKey$),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(([command, scaleFactor, instrumentKey]) => {
      if (command.type === ActiveOrderBookHotKeysTypes.increaseScale && scaleFactor < this.maxScaleFactor) {
        setScaleFactor(scaleFactor + 1, instrumentKey);
        return;
      }

      if (command.type === ActiveOrderBookHotKeysTypes.decreaseScale && scaleFactor > 1) {
        setScaleFactor(scaleFactor - 1, instrumentKey);
        return;
      }
    });

    instrumentKey$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      const storageKey = getStorageKey(settings);

      this.widgetLocalStateService.getStateRecord<ScaleState>(this.guid(), storageKey).pipe(
        take(1)
      ).subscribe(savedValue => {
        if (savedValue != null) {
          this.scalperOrderBookSharedContext.setScaleFactor(savedValue.scaleFactor);
        } else {
          this.scalperOrderBookSharedContext.setScaleFactor(1);
        }
      });
    });
  }

  private initHiddenOrdersIndicators(): void {
    this.hiddenOrdersIndicators$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.currentOrders$,
      this.sinks.displayRange$
    ]).pipe(
      map(([orderBookBody, currentOrders, displayRange]) => {
        if (displayRange == null || orderBookBody.length === 0) {
          return {up: false, down: false};
        }

        const upPrice = displayRange.start < orderBookBody.length
          ? orderBookBody[displayRange.start]?.price
          : null;
        const downIndex = Math.min(displayRange.end, orderBookBody.length - 1);
        const downPrice = downIndex >= 0
          ? orderBookBody[downIndex]?.price
          : null;

        const getOrderPrice = (order: { triggerPrice?: number, price?: number }): number | null =>
          order.triggerPrice ?? order.price ?? null;

        return {
          up: (upPrice != null) && currentOrders.some(o => {
            const price = getOrderPrice(o);
            return price != null && price > upPrice;
          }),
          down: (downPrice != null) && currentOrders.some(o => {
            const price = getOrderPrice(o);
            return price != null && price < downPrice;
          })
        };
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private initResizeHandles(): void {
    this.resizeHandles$ = combineLatest({
      settings: this.widgetSettings$,
      contentSize: this.sinks.contentSize$,
      override: this.widthsOverride$
    }).pipe(
      map(x => {
        const containerWidth = x.contentSize?.width ?? 0;
        if (containerWidth <= 0) {
          return [];
        }

        const showTradesPanel = x.settings.showTradesPanel ?? true;
        const showClustersPanel = x.settings.showTradesClustersPanel ?? true;

        const rects = LayoutHelper.computePanelRects(
          {
            widths: x.override ?? x.settings.layout?.widths ?? {},
            showTradesPanel,
            showClustersPanel
          },
          containerWidth
        );

        const handles: ResizeHandleView[] = [];

        if (rects.clusters != null) {
          handles.push({
            leftPanelId: RenderPanelId.TradeClusters,
            x: rects.clusters.x + rects.clusters.width
          });
        }

        if (rects.trades != null) {
          handles.push({
            leftPanelId: RenderPanelId.Trades,
            x: rects.trades.x + rects.trades.width
          });
        }

        return handles;
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private initRulerMarker(): void {
    this.rulerMarker$ = combineLatest({
      hover: this.sinks.hoveredRow$,
      extendedSettings: this.dataContext.extendedSettings$,
      orderBook: this.dataContext.orderBook$,
      contentSize: this.sinks.contentSize$,
      override: this.widthsOverride$,
      gridSettings: this.scalperOrderBookSharedContext.gridSettings$
    }).pipe(
      map(x => {
        const settings = x.extendedSettings.widgetSettings;
        if (x.hover == null || !(settings.showRuler ?? false)) {
          return null;
        }

        const bestAsk = x.orderBook.rows.a.length > 0 ? x.orderBook.rows.a[0].p : null;
        const bestBid = x.orderBook.rows.b.length > 0 ? x.orderBook.rows.b[0].p : null;

        const markerPrice = x.hover.price;
        let bestPrice: number | null = null;
        if (bestAsk != null && markerPrice >= bestAsk) {
          bestPrice = bestAsk;
        } else if (bestBid != null && markerPrice <= bestBid) {
          bestPrice = bestBid;
        }

        if (bestPrice == null) {
          return null;
        }

        const markerDisplayFormat = settings.rulerSettings?.markerDisplayFormat ?? PriceUnits.Points;

        let text: string;
        if (markerDisplayFormat === PriceUnits.Percents) {
          const percents = MathHelper.round(Math.abs(bestPrice - markerPrice) / markerPrice * 100, 3);
          text = `${percents}%`;
        } else {
          const points = Math.round(Math.abs(bestPrice - markerPrice) / x.extendedSettings.instrument.minstep);
          text = `${points}`;
        }

        const containerWidth = x.contentSize?.width ?? 0;
        const rects = LayoutHelper.computePanelRects(
          {
            widths: x.override ?? settings.layout?.widths ?? {},
            showTradesPanel: settings.showTradesPanel ?? true,
            showClustersPanel: settings.showTradesClustersPanel ?? true
          },
          containerWidth
        );

        return {
          y: x.hover.y,
          rowHeight: x.gridSettings.rowHeight,
          text,
          left: rects.table.x,
          isLeftSide: rects.table.x > (RULER_MARKER_RESERVED_WIDTH + 5)
        };
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private updateTradesClusterPanelSettings(updates: Partial<TradesClusterPanelSettings>): void {
    this.widgetSettings$.pipe(
      take(1)
    ).subscribe(settings => {
      this.settingsWriteService.updateInstrumentLinkedSettings(
        {
          tradesClusterPanelSettings: {
            ...(settings.tradesClusterPanelSettings ?? TradesClusterPanelSettingsDefaults),
            ...updates
          }
        },
        settings
      );
    });
  }

  private isFillingByHeightNeeded(currentRows: PriceRow[], rowHeight: number): boolean {
    const displayRowsCount = this.getDisplayRowsCount(rowHeight);
    const previousHeight = this.lastContainerHeight;
    this.lastContainerHeight = this.getContainerHeight();

    return currentRows.length < displayRowsCount || previousHeight < this.lastContainerHeight;
  }

  private getDisplayRowsCount(rowHeight: number): number {
    return Math.ceil((this.getContainerHeight() * 2 / rowHeight));
  }

  private getContainerHeight(): number {
    return this.sinks.contentSize$.value?.height ?? 0;
  }

  private initFloatingPanelPosition(stateKey: string, geContainerBounds: () => DOMRect | null): Observable<Point> {
    const savedPosition$ = this.widgetLocalStateService.getStateRecord<Point>(this.guid(), stateKey).pipe(
      map(p => p ?? {x: 0, y: 0})
    );

    return combineLatest({
      contentSize: this.sinks.contentSize$,
      savedPosition: savedPosition$
    }).pipe(
      map(s => {
        let x = s.savedPosition.x;
        let y = s.savedPosition.y;

        const containerBounds = geContainerBounds();
        const paddingCorrection = 4;
        const maxXOffset = Math.max(0, (s.contentSize?.width ?? 0) - (containerBounds?.width ?? 0));
        const maxYOffset = Math.max(0, (s.contentSize?.height ?? 0) - (containerBounds?.height ?? 0));

        if ((Math.floor(x) - paddingCorrection) > maxXOffset) {
          x = 0;
        }

        if (Math.floor(Math.abs(y)) > maxYOffset) {
          y = 0;
        }

        return {x, y};
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
