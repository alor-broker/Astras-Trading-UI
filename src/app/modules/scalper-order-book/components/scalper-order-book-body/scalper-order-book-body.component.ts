import { AfterViewInit, Component, DestroyRef, ElementRef, InjectionToken, OnDestroy, OnInit, input, viewChild, inject } from '@angular/core';
import {CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport} from '@angular/cdk/scrolling';
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  interval,
  NEVER,
  Observable,
  shareReplay,
  take,
  withLatestFrom,
} from 'rxjs';
import {PriceRowsStore} from '../../utils/price-rows-store';
import {map, switchMap} from 'rxjs/operators';
import {ContentSize} from '../../../../shared/models/dashboard/dashboard-item.model';
import {ListRange} from '@angular/cdk/collections';
import {ScalperOrderBookDataContext} from '../../models/scalper-order-book-data-context.model';
import {ScalperOrderBookDataProvider} from '../../services/scalper-order-book-data-provider.service';
import {PriceRow, ScalperOrderBookRowType} from '../../models/scalper-order-book.model';
import {ScalperOrderBookTableHelper} from '../../utils/scalper-order-book-table.helper';
import {ScalperOrderBookWidgetSettings} from '../../models/scalper-order-book-settings.model';
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {
  SCALPER_ORDERBOOK_SHARED_CONTEXT,
  ScalperOrderBookSharedContext
} from "../scalper-order-book/scalper-order-book.component";
import {CdkDrag, CdkDragEnd, Point} from "@angular/cdk/drag-drop";
import {WidgetLocalStateService} from "../../../../shared/services/widget-local-state.service";
import {Side} from "../../../../shared/models/enums/side.model";
import {InstrumentKey} from "../../../../shared/models/instruments/instrument-key.model";
import {isInstrumentEqual} from "../../../../shared/utils/settings-helper";
import {toInstrumentKey} from "../../../../shared/utils/instruments";
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes
} from "../../../../shared/models/terminal-settings/terminal-settings.model";
import {ScalperHotKeyCommandService} from "../../services/scalper-hot-key-command.service";
import {ScalperOrderBookSettingsWriteService} from "../../services/scalper-order-book-settings-write.service";
import {QuotesService} from "../../../../shared/services/quotes.service";
import {PortfolioSubscriptionsService} from "../../../../shared/services/portfolio-subscriptions.service";
import {AllTradesService} from "../../../../shared/services/all-trades.service";
import {DataContextBuilder} from "../../utils/data-context-builder";
import {TopPanelComponent} from '../top-panel/top-panel.component';
import {LetDirective} from '@ngrx/component';
import {NzSpinComponent} from 'ng-zorro-antd/spin';
import {NzResizeObserverDirective} from 'ng-zorro-antd/cdk/resize-observer';
import {PanelsContainerComponent} from '../panels/panels-container/panels-container.component';
import {PanelComponent} from '../panels/panel/panel.component';
import {TradeClustersPanelComponent} from '../trade-clusters-panel/trade-clusters-panel.component';
import {TradesPanelComponent} from '../trades-panel/trades-panel.component';
import {ScalperOrderBookTableComponent} from '../scalper-order-book-table/scalper-order-book-table.component';
import {
  LimitOrdersVolumeIndicatorComponent
} from '../limit-orders-volume-indicator/limit-orders-volume-indicator.component';
import {OrdersIndicatorComponent} from '../orders-indicator/orders-indicator.component';
import {TopFloatingPanelComponent} from '../top-floating-panel/top-floating-panel.component';
import {BottomFloatingPanelComponent} from '../bottom-floating-panel/bottom-floating-panel.component';
import {PossibleActionsPanelComponent} from '../possible-actions-panel/possible-actions-panel.component';
import {NzEmptyComponent} from 'ng-zorro-antd/empty';
import {AsyncPipe} from '@angular/common';

export interface ScalperOrderBookBodyRef {
  getElement(): ElementRef<HTMLElement>;
}

export interface RulerContext {
  setHoveredRow(hoveredRow: { price: number } | null): void;

  get hoveredRow$(): Observable<{ price: number } | null>;
}

export const SCALPER_ORDERBOOK_BODY_REF = new InjectionToken<ScalperOrderBookBodyRef>('ScalperOrderBookBodyRef');
export const RULER_CONTEX = new InjectionToken<RulerContext>('RulerContext');

interface ScaleState {
  scaleFactor: number;
}

@Component({
  selector: 'ats-scalper-order-book-body',
  templateUrl: './scalper-order-book-body.component.html',
  styleUrls: ['./scalper-order-book-body.component.less'],
  providers: [
    PriceRowsStore,
    {provide: SCALPER_ORDERBOOK_BODY_REF, useExisting: ScalperOrderBookBodyComponent},
    {provide: RULER_CONTEX, useExisting: ScalperOrderBookBodyComponent}
  ],
  imports: [
    TopPanelComponent,
    LetDirective,
    NzSpinComponent,
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    NzResizeObserverDirective,
    CdkVirtualForOf,
    PanelsContainerComponent,
    PanelComponent,
    TradeClustersPanelComponent,
    TradesPanelComponent,
    ScalperOrderBookTableComponent,
    LimitOrdersVolumeIndicatorComponent,
    OrdersIndicatorComponent,
    CdkDrag,
    TopFloatingPanelComponent,
    BottomFloatingPanelComponent,
    PossibleActionsPanelComponent,
    NzEmptyComponent,
    AsyncPipe
  ]
})
export class ScalperOrderBookBodyComponent implements OnInit,
  AfterViewInit,
  OnDestroy,
  ScalperOrderBookBodyRef,
  RulerContext {
  private readonly scalperOrderBookSharedContext = inject<ScalperOrderBookSharedContext>(SCALPER_ORDERBOOK_SHARED_CONTEXT, { skipSelf: true });
  private readonly scalperOrderBookDataProvider = inject(ScalperOrderBookDataProvider);
  private readonly settingsWriteService = inject(ScalperOrderBookSettingsWriteService);
  private readonly priceRowsStore = inject(PriceRowsStore);
  private readonly quotesService = inject(QuotesService);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);
  private readonly allTradesService = inject(AllTradesService);
  private readonly hotkeysService = inject(ScalperHotKeyCommandService);
  private readonly widgetLocalStateService = inject(WidgetLocalStateService);
  private readonly ref = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  readonly maxScaleFactor = 10;
  readonly sides = Side;
  readonly panelIds = {
    ordersTable: 'orders-table',
    currentTrades: 'current-trades',
    tradeClusters: 'trade-clusters'
  };

  rowHeight$!: Observable<number>;

  readonly scrollContainer = viewChild.required(CdkVirtualScrollViewport);

  readonly topFloatingPanelContainer = viewChild<ElementRef<HTMLDivElement>>('topFloatingPanelContainer');

  readonly bottomFloatingPanelContainer = viewChild<ElementRef<HTMLDivElement>>('bottomFloatingPanelContainer');

  readonly guid = input.required<string>();

  readonly isActive = input(false);

  readonly isLoading$ = new BehaviorSubject(false);
  dataContext!: ScalperOrderBookDataContext;
  hiddenOrdersIndicators$!: Observable<{ up: boolean, down: boolean }>;
  panelWidths$!: Observable<Record<string, number>>;
  topFloatingPanelPosition$!: Observable<Point>;
  bottomFloatingPanelPosition$!: Observable<Point>;
  readonly topFloatingPanelPositionStateKey = 'top-floating-panel-position';
  readonly bottomFloatingPanelPositionStateKey = 'bottom-floating-panel-position';
  readonly isTableHovered$ = new BehaviorSubject(false);
  private readonly renderItemsRange$ = new BehaviorSubject<ListRange | null>(null);
  private readonly contentSize$ = new BehaviorSubject<ContentSize | null>(null);
  private readonly hoveredPriceRow$ = new BehaviorSubject<{ price: number } | null>(null);
  private lastContainerHeight = 0;
  private widgetSettings$!: Observable<ScalperOrderBookWidgetSettings>;

  get hoveredRow$(): Observable<{ price: number } | null> {
    return this.hoveredPriceRow$.asObservable();
  }

  setHoveredRow(hoveredRow: { price: number } | null): void {
    this.hoveredPriceRow$.next(hoveredRow);
  }

  getElement(): ElementRef<HTMLElement> {
    return this.ref;
  }

  updateContentSize(entries: ResizeObserverEntry[]): void {
    entries.forEach(x => {
      this.contentSize$.next({
        width: Math.floor(x.contentRect.width),
        height: Math.floor(x.contentRect.height)
      });
    });
  }

  ngOnInit(): void {
    this.rowHeight$ = this.scalperOrderBookSharedContext.gridSettings$.pipe(
      map(s => s.rowHeight)
    );

    this.initContext();
    this.initWidgetSettings();
    this.initAutoAlign();
    this.initManualAlign();
    this.initHiddenOrdersIndicators();
    this.initLayout();
    this.initScaleChange();

    this.topFloatingPanelPosition$ = this.initFloatingPanelPosition(
      this.topFloatingPanelPositionStateKey,
      () => this.topFloatingPanelContainer()?.nativeElement.getBoundingClientRect() ?? null
    );

    this.bottomFloatingPanelPosition$ = this.initFloatingPanelPosition(
      this.bottomFloatingPanelPositionStateKey,
      () => this.bottomFloatingPanelContainer()?.nativeElement.getBoundingClientRect() ?? null
    );
  }

  ngAfterViewInit(): void {
    this.scrollContainer().renderedRangeStream.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => this.renderItemsRange$.next({
        start: x.start,
        end: x.end > 0 ? x.end - 1 : x.end
      })
    );

    this.initTableScrolling();
  }

  ngOnDestroy(): void {
    this.isLoading$.complete();
    this.isTableHovered$.complete();
    this.renderItemsRange$.complete();
    this.contentSize$.complete();
    this.hoveredPriceRow$.complete();

    this.dataContext.destroy();
    this.priceRowsStore.ngOnDestroy();
  }

  updatePanelWidths(widths: Record<string, number>): void {
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

  saveFloatingPanelPosition(event: CdkDragEnd, stateKey: string): void {
    const position = event.source.getFreeDragPosition();
    this.widgetLocalStateService.setStateRecord<Point>(
      this.guid(),
      stateKey,
      position
    );
  }

  private initManualAlign(): void {
    this.hotkeysService.commands$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(command => {
      if (command.type === AllOrderBooksHotKeysTypes.centerOrderbookKey) {
        this.alignTable();
      }
    });
  }

  private initWidgetSettings(): void {
    this.widgetSettings$ = this.dataContext.extendedSettings$.pipe(
      map(x => x.widgetSettings),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private initAutoAlign(): void {
    this.dataContext.extendedSettings$.pipe(
      map(x => x.widgetSettings),
      map(x => ({
          enabled: (x.enableAutoAlign ?? true) && (x.autoAlignIntervalSec ?? 0) > 0,
          interval: x.autoAlignIntervalSec ?? 0
        })
      ),
      switchMap(s => s.enabled ? interval(s.interval * 1000) : NEVER),
      filter(() => !this.isActive()),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.alignTable();
    });
  }

  private initHiddenOrdersIndicators(): void {
    this.hiddenOrdersIndicators$ = combineLatest([
      this.dataContext.orderBookBody$,
      this.dataContext.currentOrders$,
      this.dataContext.displayRange$,
      this.rowHeight$
    ]).pipe(
      map(([orderBookBody, currentOrders, , rowHeight]) => {
        const topOffset = this.scrollContainer().measureScrollOffset('top');
        const bottomOffset = topOffset + this.scrollContainer().getViewportSize();

        const topVisibleIndex = Math.ceil(topOffset / rowHeight);
        const bottomVisibleIndex = Math.round(bottomOffset / rowHeight) - 1;

        const upPrice = topVisibleIndex < orderBookBody.length
          ? orderBookBody[topVisibleIndex]?.price
          : null;
        const downPrice = bottomVisibleIndex >= 0 && bottomVisibleIndex < orderBookBody.length
          ? orderBookBody[bottomVisibleIndex]?.price
          : null;

        return {
          up: (upPrice != null) && !!currentOrders.find(o => {
            if (o.triggerPrice != null) {
              return o.triggerPrice > upPrice;
            }

            if (o.price != null) {
              return o.price > upPrice;
            }

            throw new Error('Price or trigger price should be present');
          }),
          down: (downPrice != null) && !!currentOrders.find(o => {
            if (o.triggerPrice != null) {
              return o.triggerPrice < downPrice;
            }

            if (o.price != null) {
              return o.price < downPrice;
            }

            throw new Error('Price or trigger price should be present');
          }),
        };
      }),
      shareReplay({bufferSize: 1, refCount: true}),
    );
  }

  private initLayout(): void {
    this.panelWidths$ = this.dataContext.extendedSettings$.pipe(
      map(x => x.widgetSettings.layout?.widths
        ?? {
          [this.panelIds.ordersTable]: 50,
          [this.panelIds.currentTrades]: 25,
          [this.panelIds.tradeClusters]: 25,
        }
      ),
      shareReplay(1)
    );
  }

  private initScaleChange(): void {
    const instrumentKey$ = this.widgetSettings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev, curr)),
      map(s => toInstrumentKey(s)),
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

    this.isTableHovered$.pipe(
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
        const newScaleFactor = scaleFactor + 1;
        setScaleFactor(newScaleFactor, instrumentKey);
        return;
      }

      if (command.type === ActiveOrderBookHotKeysTypes.decreaseScale && scaleFactor > 1) {
        const newScaleFactor = scaleFactor - 1;
        setScaleFactor(newScaleFactor, instrumentKey);
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

  private initContext(): void {
    this.dataContext = DataContextBuilder.buildContext({
        widgetGuid: this.guid(),
        bodyStreams: {
          contentSize$: this.contentSize$,
          rowHeight$: this.rowHeight$,
          scaleFactor$: this.scalperOrderBookSharedContext.scaleFactor$
        },
        contextStreams: {
          displayRange$: this.renderItemsRange$.asObservable(),
          workingVolume$: this.scalperOrderBookSharedContext.workingVolume$
            .pipe(
              filter(x => x != null && x > 0),
              map(x => x!)
            )
        },
        bodyParamsGetters: {
          getVisibleRowsCount: (rowHeight: number) => this.getDisplayRowsCount(rowHeight),
          isFillingByHeightNeeded: (currentRows: PriceRow[], rowHeight: number) => this.isFillingByHeightNeeded(currentRows, rowHeight)
        },
        changeNotifications: {
          priceRowsRegenerationStarted: () => this.isLoading$.next(true),
          priceRowsRegenerationCompleted: () => {
            this.scrollContainer().checkViewportSize();
            this.alignTable();
            this.isLoading$.next(false);
          }
        }
      },
      {
        priceRowsStore: this.priceRowsStore,
        scalperOrderBookDataProvider: this.scalperOrderBookDataProvider,
        quotesService: this.quotesService,
        portfolioSubscriptionsService: this.portfolioSubscriptionsService,
        allTradesService: this.allTradesService
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
    return this.scrollContainer().measureViewportSize('vertical');
  }

  private alignTable(): void {
    setTimeout(() => {
      combineLatest({
        orderBookBody: this.dataContext.orderBookBody$,
        rowHeight: this.rowHeight$
      }).pipe(
        take(1)
      ).subscribe(x => {
        let targetIndex: number | null = null;

        const spreadRows = x.orderBookBody.filter(r => r.rowType === ScalperOrderBookRowType.Spread || r.rowType === ScalperOrderBookRowType.Mixed);
        if (spreadRows.length > 0) {
          targetIndex = x.orderBookBody.indexOf(spreadRows[0]) + Math.round(spreadRows.length / 2);
        } else {
          const bestSellRowIndex = x.orderBookBody.findIndex(r => r.rowType === ScalperOrderBookRowType.Ask && (r.isBest ?? false));
          if (bestSellRowIndex >= 0) {
            targetIndex = bestSellRowIndex;
          } else {
            const bestBidRowIndex = x.orderBookBody.findIndex(r => r.rowType === ScalperOrderBookRowType.Bid && (r.isBest ?? false));
            if (bestBidRowIndex >= 0) {
              targetIndex = bestBidRowIndex;
            } else {
              const startRowIndex = x.orderBookBody.findIndex(r => r.isStartRow);
              if (startRowIndex >= 0) {
                targetIndex = startRowIndex;
              }
            }
          }
        }

        setTimeout(() => {
          if (targetIndex != null && !!targetIndex) {
            const viewPortSize = this.getContainerHeight();
            const visibleItemsCount = viewPortSize / x.rowHeight;
            const centerCorrection = Math.floor(visibleItemsCount / 2) - 1;

            this.scrollContainer().scrollToIndex(targetIndex! - centerCorrection);
          }
        });
      });
    });
  }

  private initTableScrolling(): void {
    combineLatest({
      index: this.scrollContainer().scrolledIndexChange,
      rowHeight: this.rowHeight$
    }).pipe(
      withLatestFrom(this.isLoading$),
      filter(([, isLoading]) => !isLoading),
      map(([x,]) => x),
      withLatestFrom(this.priceRowsStore.state$.pipe(map(x => x.rows))),
      filter(([, priceRows]) => priceRows.length > 0),
      map(([x, priceRows]) => ({...x, priceRows})),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(x => {
      const bufferItemsCount = 10;
      const topScrollOffset = this.scrollContainer().measureScrollOffset('top');
      const bottomScrollOffset = this.scrollContainer().measureScrollOffset('bottom');

      if ((topScrollOffset / x.rowHeight) < bufferItemsCount) {
        this.isLoading$.next(true);
        this.priceRowsStore.extendTop(bufferItemsCount, (addedItemsCount: number) => {
          ScalperOrderBookTableHelper.scrollTableToIndex(
            this.scrollContainer(),
            x.rowHeight,
            x.index + addedItemsCount,
            false,
            false
          );
          this.isLoading$.next(false);
        });

        return;
      }

      if ((bottomScrollOffset / x.rowHeight) < bufferItemsCount) {
        this.isLoading$.next(true);
        this.priceRowsStore.extendBottom(bufferItemsCount, () => {
          this.isLoading$.next(false);
        });
      }
    });
  }

  private initFloatingPanelPosition(stateKey: string, geContainerBounds: () => DOMRect | null): Observable<Point> {
    const savedPosition$ = this.widgetLocalStateService.getStateRecord<Point>(this.guid(), stateKey).pipe(
      map(p => p ?? {x: 0, y: 0})
    );

    return combineLatest({
      contentSize: this.contentSize$,
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
