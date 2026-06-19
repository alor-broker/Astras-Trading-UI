import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  OnDestroy,
  output,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  Observable,
  of
} from 'rxjs';
import {
  distinctUntilChanged,
  map,
  switchMap
} from 'rxjs/operators';
import {ListRange} from '@angular/cdk/collections';
import {ThemeService} from '@terminal-core-lib/features/themes/services/theme.service';
import {ThemeColors} from '@terminal-core-lib/features/themes/themes.types';
import {MathHelper} from '@terminal-core-lib/common/utils/math.helper';
import {NumberDisplayFormat} from '@terminal-core-lib/common/types/number-display-format.types';
import {ContentSize} from '@terminal-core-lib/features/dashboard/types/dashboard-item.types';
import {InstrumentTradesItem} from '@terminal-core-lib/features/instruments/services/instrument-trades-service.types';
import {ActiveOrderBookHotKeysTypes} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {CurrentOrderDisplay} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  TradesClusterHighlightMode,
  VolumeHighlightMode
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {ScalperCommandProcessorService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-command-processor.service';
import {ScalperHotKeyCommandService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/scalper-hot-key-command.service';
import {CancelOrdersCommand} from '@terminal-widgets-lib/widgets/scalper-order-book/commands/cancel-orders-command';
import {TradeClustersService} from '@terminal-widgets-lib/widgets/scalper-order-book/services/trade-clusters.service';
import {SCALPER_ORDERBOOK_SHARED_CONTEXT} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book/scalper-order-book';
import {TradesClusterPanelSettingsDefaults} from '@terminal-widgets-lib/widgets/scalper-order-book/components/scalper-order-book-settings/constants/settings-defaults';
import {ScalperOrderBook2Renderer} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/scalper-order-book-2-renderer';
import {
  HoveredRowInfo,
  OwnTradeDisplay,
  RenderPanelId,
  RenderThemeColors,
  VisibleRange
} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/render-contracts';
import {DisplayModel} from '@terminal-widgets-lib/widgets/scalper-order-book-2/render/price-grid/price-grid-types';
import {ClustersStreamBuilder} from '@terminal-widgets-lib/widgets/scalper-order-book-2/utils/clusters-stream-builder';
import {OwnTradesHelper} from '@terminal-widgets-lib/widgets/scalper-order-book-2/utils/own-trades-helper';

/**
 * Каналы, через которые поверхность отрисовки сообщает состояние наружу.
 * Subjects создаются родительским компонентом, так как участвуют
 * в построении data context до инициализации поверхности.
 */
export interface SurfaceEventSinks {
  readonly contentSize$: BehaviorSubject<ContentSize | null>;
  readonly displayRange$: BehaviorSubject<ListRange | null>;
  readonly hoveredRow$: BehaviorSubject<HoveredRowInfo | null>;
  readonly isTableHovered$: BehaviorSubject<boolean>;
  readonly isLoading$: BehaviorSubject<boolean>;
  /** Ширина содержимого таблицы стакана из рендера (для синхронной компоновки оверлеев). */
  readonly tableContentWidth$: BehaviorSubject<number>;
}

/**
 * Поверхность отрисовки: владеет фасадом pixi рендера, передает в него данные
 * из data context и преобразует события рендера в торговые команды.
 * Сама ничего не отрисовывает в DOM, кроме канвы рендера.
 */
@Component({
  selector: 'ats-scalper-order-book-2-surface',
  template: '<div #canvasHost class="canvas-host"></div>',
  styleUrls: ['./scalper-order-book-2-surface.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class ScalperOrderBook2Surface implements AfterViewInit, OnDestroy {
  readonly dataContext = input.required<ScalperOrderBookDataContext>();

  readonly sinks = input.required<SurfaceEventSinks>();

  /** Поток модели отображения (виртуальная ценовая сетка), строится телом виджета. */
  readonly displayModel = input.required<Observable<DisplayModel | null>>();

  /** Лёгкий поток обезличенных сделок (порядок поддерживается потоком, без сортировки на тик). */
  readonly trades = input.required<Observable<InstrumentTradesItem[]>>();

  readonly isActive = input(false);

  readonly clustersContextMenu = output<MouseEvent>();

  readonly panelDoubleClick = output<RenderPanelId>();

  private readonly canvasHost = viewChild.required<ElementRef<HTMLDivElement>>('canvasHost');

  private readonly themeService = inject(ThemeService);

  private readonly commandProcessorService = inject(ScalperCommandProcessorService);

  private readonly hotkeysService = inject(ScalperHotKeyCommandService);

  private readonly cancelOrdersCommand = inject(CancelOrdersCommand);

  private readonly tradeClustersService = inject(TradeClustersService);

  private readonly sharedContext = inject(SCALPER_ORDERBOOK_SHARED_CONTEXT, {skipSelf: true});

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly destroyRef = inject(DestroyRef);

  private readonly locale = inject(LOCALE_ID);

  private renderer: ScalperOrderBook2Renderer | null = null;

  private isDestroyed = false;

  private readonly widthsOverride$ = new BehaviorSubject<Record<string, number> | null>(null);

  private showGrowingVolume = false;

  /**
   * Hover нужен Angular части только для маркера линейки.
   * Когда линейка выключена, событие не входит в Angular zone,
   * чтобы не запускать change detection на каждое движение мыши.
   */
  private isRulerEnabled = false;

  ngAfterViewInit(): void {
    // Приложение zoneless: рендер - обычный JS, отдельная zone ему не нужна.
    // Колбэки, меняющие Angular-состояние, помечают представление через ChangeDetectorRef.
    void ScalperOrderBook2Renderer.create(
      this.canvasHost().nativeElement,
      {
        rowMouseDown: (e, row) => this.runInAngular(() => {
          if (e.button === 0) {
            this.commandProcessorService.processLeftMouseClick(e, row, this.dataContext());
          } else if (e.button === 2) {
            this.commandProcessorService.processRightMouseClick(e, row, this.dataContext());
          }
        }),
        orderIndicatorClick: orders => this.runInAngular(() => {
          const activeOrders = orders.filter(o => !o.isDirty);
          if (activeOrders.length > 0) {
            this.cancelOrdersCommand.execute({
              ordersToCancel: activeOrders.map(x => ({
                orderId: x.orderId,
                exchange: x.targetInstrument.exchange,
                portfolio: x.ownedPortfolio.portfolio,
                orderType: x.type
              }))
            });
          }
        }),
        ordersDropped: (orders, targetRow) => this.runInAngular(() => {
          const activeOrders = orders.filter(o => !o.isDirty);
          if (activeOrders.length > 0) {
            this.commandProcessorService.updateOrdersPrice(activeOrders, targetRow, this.dataContext());
          }
        }),
        hoverChanged: hover => {
          // Hover нужен Angular части только для маркера линейки. Когда линейка
          // выключена, значение не отдаётся, чтобы не запускать change detection
          // на каждое движение мыши (собственную подсветку строки рисует рендер).
          if (this.isRulerEnabled) {
            this.runInAngular(() => this.sinks().hoveredRow$.next(hover));
          }
        },
        // Диапазон видимых строк питает async pipe привязки (индикаторы заявок
        // вне экрана). Событие срабатывает только при пересечении границы строки.
        visibleRangeChanged: range => this.runInAngular(() => this.sinks().displayRange$.next(this.toListRange(range))),
        // Ширина содержимого таблицы меняется редко; обновляет позиции
        // resize-ручек и линейки в Angular-части.
        tableContentWidthChanged: width => this.runInAngular(() => this.sinks().tableContentWidth$.next(width)),
        viewportSizeChanged: size => this.runInAngular(() => this.sinks().contentSize$.next(size)),
        tablePointerInsideChanged: isInside => this.sinks().isTableHovered$.next(isInside),
        clustersContextMenuRequested: e => this.runInAngular(() => this.clustersContextMenu.emit(e)),
        panelDoubleClicked: panelId => this.runInAngular(() => this.panelDoubleClick.emit(panelId))
      }
    ).then(renderer => {
      if (this.isDestroyed) {
        renderer.destroy();
        return;
      }

      this.renderer = renderer;
      this.initDataBindings(renderer);
    }).catch((err: unknown) => {
      console.error('Failed to initialize scalper order book renderer', err);
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.widthsOverride$.complete();
    this.renderer?.destroy();
    this.renderer = null;
  }

  /**
   * Выполняет действие, изменяющее Angular-состояние из колбэка рендера
   * (DOM-событие/кадр вне CD), и помечает представление для проверки.
   * В zoneless-приложении это замена повторного входа в NgZone.
   */
  private runInAngular(action: () => void): void {
    action();
    this.cdr.markForCheck();
  }

  /** Центрирует таблицу: середина спреда → лучший ask → лучший bid → стартовая строка. */
  alignTable(): void {
    this.renderer?.alignTable(true);
  }

  /** Временное переопределение ширин секций (resize, разворачивание панели). */
  setWidthsOverride(widths: Record<string, number> | null): void {
    this.widthsOverride$.next(widths);
  }

  private toListRange(range: VisibleRange | null): ListRange | null {
    if (range == null) {
      return null;
    }

    return {start: range.start, end: range.end};
  }

  private initDataBindings(renderer: ScalperOrderBook2Renderer): void {
    const dataContext = this.dataContext();

    const settings$ = dataContext.extendedSettings$;

    this.displayModel().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(model => renderer.setDisplayModel(model));

    dataContext.currentOrders$.pipe(
      // События приходят на каждое обновление портфеля. Без сравнения каждое из них
      // перерисовывало бы все экземпляры виджета, даже когда их заявки не изменились.
      distinctUntilChanged((prev, curr) => this.areOrdersEqual(prev, curr)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(orders => renderer.setOrders(orders));

    // Поток уже поддерживает порядок по времени и обрезку по глубине - копировать
    // и сортировать на каждый тик не нужно.
    this.trades().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(trades => renderer.setTrades(trades));

    combineLatest({
      ownTrades: dataContext.ownTrades$,
      position: dataContext.position$
    }).pipe(
      map(x => OwnTradesHelper.filterTradesByPosition(x.ownTrades, x.position)),
      distinctUntilChanged((prev, curr) => this.areOwnTradesEqual(prev, curr)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(ownTrades => {
      renderer.setOwnTrades(ownTrades);
    });

    settings$.pipe(
      map(s => s.widgetSettings.showTradesClustersPanel ?? false),
      distinctUntilChanged(),
      switchMap(isVisible => {
        if (!isVisible) {
          return of([]);
        }

        return ClustersStreamBuilder.buildClustersStream(
          settings$.pipe(map(s => s.widgetSettings)),
          this.tradeClustersService
        );
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(clusters => renderer.setClusters(clusters));

    this.themeService.getThemeSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(theme => renderer.setTheme(this.toRenderTheme(theme.themeColors)));

    this.sharedContext.gridSettings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(gridSettings => renderer.setGridSettings(gridSettings));

    settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => {
      const widgetSettings = settings.widgetSettings;

      this.isRulerEnabled = widgetSettings.showRuler ?? false;

      renderer.setDisplaySettings({
        volumeHighlightMode: widgetSettings.volumeHighlightMode ?? VolumeHighlightMode.Off,
        volumeHighlightOptions: widgetSettings.volumeHighlightOptions,
        volumeHighlightFullness: widgetSettings.volumeHighlightFullness ?? 10000,
        volumeDisplayFormat: widgetSettings.volumeDisplayFormat ?? NumberDisplayFormat.Default,
        priceDecimalsCount: widgetSettings.showPriceWithZeroPadding === true
          ? MathHelper.getPrecision(settings.instrument.minstep)
          : null,
        locale: this.locale
      });

      renderer.setTradesPanelSettings({
        minTradeVolumeFilter: widgetSettings.tradesPanelSettings?.minTradeVolumeFilter ?? 0,
        hideFilteredTrades: widgetSettings.tradesPanelSettings?.hideFilteredTrades ?? false,
        tradesAggregationPeriodMs: widgetSettings.tradesPanelSettings?.tradesAggregationPeriodMs ?? 0,
        showOwnTrades: widgetSettings.tradesPanelSettings?.showOwnTrades ?? false
      });

      renderer.setClustersPanelSettings({
        volumeDisplayFormat: widgetSettings.tradesClusterPanelSettings?.volumeDisplayFormat
          ?? TradesClusterPanelSettingsDefaults.volumeDisplayFormat
          ?? NumberDisplayFormat.LetterSuffix,
        highlightMode: widgetSettings.tradesClusterPanelSettings?.highlightMode ?? TradesClusterHighlightMode.Off,
        targetVolume: widgetSettings.tradesClusterPanelSettings?.targetVolume ?? null,
        displayIntervalsCount: widgetSettings.tradesClusterPanelSettings?.displayIntervalsCount
          ?? TradesClusterPanelSettingsDefaults.displayIntervalsCount
      });
    });

    combineLatest({
      settings: settings$,
      widthsOverride: this.widthsOverride$
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      renderer.setLayout({
        widths: x.widthsOverride ?? x.settings.widgetSettings.layout?.widths ?? {},
        showTradesPanel: x.settings.widgetSettings.showTradesPanel ?? true,
        showClustersPanel: x.settings.widgetSettings.showTradesClustersPanel ?? true
      });
    });

    this.initHotkeys(renderer);
  }

  private initHotkeys(renderer: ScalperOrderBook2Renderer): void {
    this.dataContext().extendedSettings$.pipe(
      mapWith(
        () => this.hotkeysService.commands$,
        (settings, command) => ({settings, command})
      ),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(({settings, command}) => {
      if (command.type === ActiveOrderBookHotKeysTypes.toggleGrowingVolumeDisplay) {
        if (this.isActive()) {
          this.showGrowingVolume = !this.showGrowingVolume;
          renderer.setGrowingVolumeVisible(this.showGrowingVolume);
        }

        return;
      }

      if (settings.widgetSettings.disableHotkeys) {
        return;
      }

      this.commandProcessorService.processHotkeyPress(command, this.isActive(), this.dataContext());
    });
  }

  private areOrdersEqual(prev: CurrentOrderDisplay[], curr: CurrentOrderDisplay[]): boolean {
    if (prev.length !== curr.length) {
      return false;
    }

    for (let i = 0; i < prev.length; i++) {
      const a = prev[i];
      const b = curr[i];

      if (a.orderId !== b.orderId
        || a.type !== b.type
        || a.side !== b.side
        || a.displayVolume !== b.displayVolume
        || a.price !== b.price
        || a.triggerPrice !== b.triggerPrice
        || a.isDirty !== b.isDirty) {
        return false;
      }
    }

    return true;
  }

  private areOwnTradesEqual(prev: OwnTradeDisplay[], curr: OwnTradeDisplay[]): boolean {
    if (prev.length !== curr.length) {
      return false;
    }

    for (let i = 0; i < prev.length; i++) {
      const a = prev[i];
      const b = curr[i];

      if (a.price !== b.price || a.qtyBatch !== b.qtyBatch || a.side !== b.side) {
        return false;
      }
    }

    return true;
  }

  private toRenderTheme(themeColors: ThemeColors): RenderThemeColors {
    const documentStyle = getComputedStyle(document.documentElement);
    const readCssVar = (name: string, fallback: string): string => {
      const value = documentStyle.getPropertyValue(name).trim();
      return value !== '' ? value : fallback;
    };

    return {
      buyColor: themeColors.buyColor,
      sellColor: themeColors.sellColor,
      mixColor: themeColors.mixColor,
      buyColorBackground: themeColors.buyColorBackground,
      sellColorBackground: themeColors.sellColorBackground,
      buyColorBackgroundLight: themeColors.buyColorBackgroundLight,
      buyColorAccent: themeColors.buyColorAccent,
      sellColorAccent: themeColors.sellColorAccent,
      buySellBtnTextColor: themeColors.buySellBtnTextColor,
      componentBackground: themeColors.componentBackground,
      primaryColor: themeColors.primaryColor,
      textColor: themeColors.textColor,
      textMaxContrastColor: themeColors.textMaxContrastColor,
      tableGridColor: themeColors.tableGridColor,
      tableBorderColor: readCssVar('--ats-table-border-color', themeColors.tableGridColor),
      disabledColor: readCssVar('--ats-disabled-color', 'rgba(120,120,120,1)'),
      warningColor: readCssVar('--ats-warning-color', '#d9a31c')
    };
  }
}
