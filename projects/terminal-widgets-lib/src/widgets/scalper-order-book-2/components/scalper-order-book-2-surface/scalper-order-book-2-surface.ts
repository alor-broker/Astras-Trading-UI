import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  input,
  LOCALE_ID,
  NgZone,
  OnDestroy,
  output,
  viewChild,
  ViewEncapsulation
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
  BehaviorSubject,
  combineLatest,
  of,
  Subject,
  take,
  takeUntil
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
import {ActiveOrderBookHotKeysTypes} from '@terminal-core-lib/features/terminal-settings/terminal-settings.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {ScalperOrderBookDataContext} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {
  CurrentOrderDisplay,
  ScalperOrderBookRowType
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book.types';
import {
  TradesClusterHighlightMode,
  VolumeHighlightMode
} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {PriceRowsStore} from '@terminal-widgets-lib/widgets/scalper-order-book/utils/price-rows-store';
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

  readonly isActive = input(false);

  readonly clustersContextMenu = output<MouseEvent>();

  readonly panelDoubleClick = output<RenderPanelId>();

  private readonly canvasHost = viewChild.required<ElementRef<HTMLDivElement>>('canvasHost');

  private readonly themeService = inject(ThemeService);

  private readonly commandProcessorService = inject(ScalperCommandProcessorService);

  private readonly hotkeysService = inject(ScalperHotKeyCommandService);

  private readonly cancelOrdersCommand = inject(CancelOrdersCommand);

  private readonly tradeClustersService = inject(TradeClustersService);

  private readonly priceRowsStore = inject(PriceRowsStore, {skipSelf: true});

  private readonly sharedContext = inject(SCALPER_ORDERBOOK_SHARED_CONTEXT, {skipSelf: true});

  private readonly ngZone = inject(NgZone);

  private readonly destroyRef = inject(DestroyRef);

  private readonly locale = inject(LOCALE_ID);

  private readonly destroy$ = new Subject<void>();

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
    this.ngZone.runOutsideAngular(() => {
      void ScalperOrderBook2Renderer.create(
        this.canvasHost().nativeElement,
        {
          rowMouseDown: (e, row) => this.ngZone.run(() => {
            if (e.button === 0) {
              this.commandProcessorService.processLeftMouseClick(e, row, this.dataContext());
            } else if (e.button === 2) {
              this.commandProcessorService.processRightMouseClick(e, row, this.dataContext());
            }
          }),
          orderIndicatorClick: orders => this.ngZone.run(() => {
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
          ordersDropped: (orders, targetRow) => this.ngZone.run(() => {
            const activeOrders = orders.filter(o => !o.isDirty);
            if (activeOrders.length > 0) {
              this.commandProcessorService.updateOrdersPrice(activeOrders, targetRow, this.dataContext());
            }
          }),
          hoverChanged: hover => {
            if (this.isRulerEnabled) {
              this.ngZone.run(() => this.sinks().hoveredRow$.next(hover));
            } else {
              this.sinks().hoveredRow$.next(hover);
            }
          },
          // Диапазон видимых строк питает async pipe привязки (индикаторы заявок
          // вне экрана), поэтому требуется вход в zone. Событие срабатывает
          // только при пересечении границы строки, а не на каждый пиксель.
          visibleRangeChanged: range => this.ngZone.run(() => this.sinks().displayRange$.next(this.toListRange(range))),
          viewportSizeChanged: size => this.ngZone.run(() => this.sinks().contentSize$.next(size)),
          scrollEdgeReached: edge => this.ngZone.run(() => this.extendRows(edge)),
          tablePointerInsideChanged: isInside => this.sinks().isTableHovered$.next(isInside),
          clustersContextMenuRequested: e => this.ngZone.run(() => this.clustersContextMenu.emit(e)),
          panelDoubleClicked: panelId => this.ngZone.run(() => this.panelDoubleClick.emit(panelId))
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
    });
  }

  ngOnDestroy(): void {
    this.isDestroyed = true;
    this.destroy$.next();
    this.destroy$.complete();
    this.widthsOverride$.complete();
    this.renderer?.destroy();
    this.renderer = null;
  }

  /** Центрирует таблицу: середина спреда → лучший ask → лучший bid → стартовая строка. */
  alignTable(): void {
    this.dataContext().orderBookBody$.pipe(
      take(1),
      takeUntil(this.destroy$)
    ).subscribe(orderBookBody => {
      let targetIndex: number | null = null;

      const spreadRows = orderBookBody.filter(r => r.rowType === ScalperOrderBookRowType.Spread || r.rowType === ScalperOrderBookRowType.Mixed);
      if (spreadRows.length > 0) {
        targetIndex = orderBookBody.indexOf(spreadRows[0]) + Math.round(spreadRows.length / 2);
      } else {
        const bestSellRowIndex = orderBookBody.findIndex(r => r.rowType === ScalperOrderBookRowType.Ask && (r.isBest ?? false));
        if (bestSellRowIndex >= 0) {
          targetIndex = bestSellRowIndex;
        } else {
          const bestBidRowIndex = orderBookBody.findIndex(r => r.rowType === ScalperOrderBookRowType.Bid && (r.isBest ?? false));
          if (bestBidRowIndex >= 0) {
            targetIndex = bestBidRowIndex;
          } else {
            const startRowIndex = orderBookBody.findIndex(r => r.isStartRow);
            if (startRowIndex >= 0) {
              targetIndex = startRowIndex;
            }
          }
        }
      }

      if (targetIndex != null) {
        const index = targetIndex;
        this.ngZone.runOutsideAngular(() => this.renderer?.centerOnRowIndex(index, true));
      }
    });
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

  private extendRows(edge: 'top' | 'bottom'): void {
    const isLoading = this.sinks().isLoading$.value;
    if (isLoading) {
      return;
    }

    const bufferItemsCount = 10;
    this.sinks().isLoading$.next(true);

    if (edge === 'top') {
      this.priceRowsStore.extendTop(bufferItemsCount, () => {
        this.sinks().isLoading$.next(false);
      });
    } else {
      this.priceRowsStore.extendBottom(bufferItemsCount, () => {
        this.sinks().isLoading$.next(false);
      });
    }
  }

  private initDataBindings(renderer: ScalperOrderBook2Renderer): void {
    const outside = (action: () => void): void => this.ngZone.runOutsideAngular(action);

    const dataContext = this.dataContext();

    const settings$ = dataContext.extendedSettings$;

    dataContext.orderBookBody$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(rows => outside(() => renderer.setRows(rows)));

    dataContext.currentOrders$.pipe(
      // События приходят на каждое обновление портфеля. Без сравнения каждое из них
      // перерисовывало бы все экземпляры виджета, даже когда их заявки не изменились.
      distinctUntilChanged((prev, curr) => this.areOrdersEqual(prev, curr)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(orders => outside(() => renderer.setOrders(orders)));

    dataContext.trades$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(trades => outside(() => {
      renderer.setTrades([...trades].sort((a, b) => a.timestamp - b.timestamp));
    }));

    combineLatest({
      ownTrades: dataContext.ownTrades$,
      position: dataContext.position$
    }).pipe(
      map(x => OwnTradesHelper.filterTradesByPosition(x.ownTrades, x.position)),
      distinctUntilChanged((prev, curr) => this.areOwnTradesEqual(prev, curr)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(ownTrades => outside(() => {
      renderer.setOwnTrades(ownTrades);
    }));

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
    ).subscribe(clusters => outside(() => renderer.setClusters(clusters)));

    this.themeService.getThemeSettings().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(theme => outside(() => renderer.setTheme(this.toRenderTheme(theme.themeColors))));

    this.sharedContext.gridSettings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(gridSettings => outside(() => renderer.setGridSettings(gridSettings)));

    settings$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(settings => outside(() => {
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
    }));

    combineLatest({
      settings: settings$,
      widthsOverride: this.widthsOverride$
    }).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => outside(() => {
      renderer.setLayout({
        widths: x.widthsOverride ?? x.settings.widgetSettings.layout?.widths ?? {},
        showTradesPanel: x.settings.widgetSettings.showTradesPanel ?? true,
        showClustersPanel: x.settings.widgetSettings.showTradesClustersPanel ?? true
      });
    }));

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
          const visible = this.showGrowingVolume;
          this.ngZone.runOutsideAngular(() => renderer.setGrowingVolumeVisible(visible));
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
