import {
  OrderBook,
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from "../models/scalper-order-book-data-context.model";
import { ScalperOrderBookDataProvider } from "../services/scalper-order-book-data-provider.service";
import {
  BodyRow,
  CurrentOrderDisplay,
  LocalOrder,
  PriceRow,
  ScalperOrderBookRowType
} from "../models/scalper-order-book.model";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  takeUntil,
  tap
} from "rxjs";
import { ListRange } from "@angular/cdk/collections";
import { ContentSize } from "../../../shared/models/dashboard/dashboard-item.model";
import {
  PriceOptions,
  PriceRowsState,
  PriceRowsStore
} from "./price-rows-store";
import { Position } from "../../../shared/models/positions/position.model";
import { isInstrumentEqual } from "../../../shared/utils/settings-helper";
import {
  map,
  startWith
} from "rxjs/operators";
import {
  OrderbookData,
  OrderbookDataRow
} from "../../orderbook/models/orderbook-data.model";
import { Range } from "../../../shared/models/common.model";
import { ScalperOrderBookConstants } from "../constants/scalper-order-book.constants";
import { QuotesService } from "../../../shared/services/quotes.service";
import { OrderBookScaleHelper } from "./order-book-scale.helper";
import { ScalperOrderBookWidgetSettings } from "../models/scalper-order-book-settings.model";
import { MathHelper } from "../../../shared/utils/math-helper";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { mapWith } from "../../../shared/utils/observable-helper";
import { PortfolioSubscriptionsService } from "../../../shared/services/portfolio-subscriptions.service";
import { Order } from "../../../shared/models/orders/order.model";
import { OrderMeta } from "../../../shared/models/orders/new-order.model";
import { AllTradesItem } from "../../../shared/models/all-trades.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { AllTradesService } from "../../../shared/services/all-trades.service";
import { Trade } from "../../../shared/models/trades/trade.model";

export interface BodyGetters {
  getVisibleRowsCount: (rowHeight: number) => number;
  isFillingByHeightNeeded: (currentRows: PriceRow[], rowHeight: number) => boolean;
}

export interface ChangeNotifications {
  priceRowsRegenerationStarted: () => void;
  priceRowsRegenerationCompleted: () => void;
}

export interface ContextStreams {
  readonly workingVolume$: Observable<number>;
  readonly displayRange$: Observable<ListRange | null>;
}

export interface BodyStreams {
  readonly contentSize$: Observable<ContentSize | null>;
  readonly rowHeight$: Observable<number>;
  readonly scaleFactor$: Observable<number>;
}

export interface DataContextBuilderArgs {
  readonly widgetGuid: string;
  readonly bodyStreams: BodyStreams;
  readonly contextStreams: ContextStreams;
  readonly bodyParamsGetters: BodyGetters;
  readonly changeNotifications: ChangeNotifications | null;
}

export interface DataContextBuilderDeps {
  readonly priceRowsStore: PriceRowsStore;
  readonly scalperOrderBookDataProvider: ScalperOrderBookDataProvider;
  readonly quotesService: QuotesService;
  readonly portfolioSubscriptionsService: PortfolioSubscriptionsService;
  readonly allTradesService: AllTradesService;
}

export class DataContextBuilder {
  static buildContext(
    args: DataContextBuilderArgs,
    deps: DataContextBuilderDeps,
  ): ScalperOrderBookDataContext {
    const destroy$ = new Subject<void>();

    const settings$ = deps.scalperOrderBookDataProvider.getSettingsStream(args.widgetGuid)
      .pipe(takeUntil(destroy$));

    const currentPortfolio$ = deps.scalperOrderBookDataProvider.getOrderBookPortfolio()
      .pipe(takeUntil(destroy$));
    const position$ = deps.scalperOrderBookDataProvider.getOrderBookPositionStream(settings$, currentPortfolio$)
      .pipe(takeUntil(destroy$));
    const orderBook$ = deps.scalperOrderBookDataProvider.getOrderBookStream(settings$)
      .pipe(takeUntil(destroy$));
    const localOrders$ = new BehaviorSubject<Map<string, LocalOrder>>(new Map());

    return {
      extendedSettings$: settings$,
      currentPortfolio$: currentPortfolio$,
      position$: position$,
      orderBook$: orderBook$,
      orderBookBody$: this.buildOrderBookBodyStream(
        args,
        deps,
        {
          extendedSettings$: settings$,
          position$,
          orderBookData$: orderBook$
        }
      ).pipe(takeUntil(destroy$)),
      currentOrders$: this.getCurrentOrdersStream(settings$, currentPortfolio$, localOrders$, deps),
      trades$: this.getInstrumentTradesStream(deps, settings$),
      ownTrades$: this.getOwnTradesStream(settings$, currentPortfolio$, deps),
      scaleFactor$: args.bodyStreams.scaleFactor$,
      ...args.contextStreams,

      // ---------------------------------------------------
      addLocalOrder(order: LocalOrder): void {
        localOrders$.pipe(
          take(1)
        ).subscribe(x => {
          const copy = new Map(x);
          copy.set(order.orderId, order);
          localOrders$.next(copy);
        });
      },
      removeLocalOrder(orderId: string): void {
        localOrders$.pipe(
          take(1)
        ).subscribe(x => {
          const copy = new Map(x);
          copy.delete(orderId);
          localOrders$.next(copy);
        });
      },
      destroy(): void {
        localOrders$.complete();
        destroy$.next();
        destroy$.complete();
      }
    };
  }

  private static buildOrderBookBodyStream(
    args: DataContextBuilderArgs,
    deps: DataContextBuilderDeps,
    sharedStreams: {
      extendedSettings$: Observable<ScalperOrderBookExtendedSettings>;
      orderBookData$: Observable<OrderBook>;
      position$: Observable<Position | null>;
    }
  ): Observable<BodyRow[]> {
    return combineLatest([
      sharedStreams.extendedSettings$,
      deps.priceRowsStore.state$,
      sharedStreams.orderBookData$,
      sharedStreams.position$,
      args.bodyStreams.contentSize$,
      args.bodyStreams.rowHeight$,
      args.bodyStreams.scaleFactor$
    ]).pipe(
      switchMap(([settings, rowsState, orderBook, position, , rowHeight, scaleFactor]) => {
        return this.mapToBodyRows(
          settings,
          rowsState,
          orderBook,
          position,
          args.bodyParamsGetters,
          args.changeNotifications,
          deps.priceRowsStore,
          rowHeight,
          scaleFactor,
          deps
        ) ?? [];
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private static mapToBodyRows(
    settings: ScalperOrderBookExtendedSettings,
    rowsState: PriceRowsState,
    orderBook: OrderBook,
    position: Position | null,
    getters: BodyGetters,
    actions: ChangeNotifications | null,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number,
    deps: DataContextBuilderDeps
  ): Observable<BodyRow[]> {
    // цены или ордербук от другого инструмента (рассинхрон стримов)
    const isOrderbookInstrumentCorrect = isInstrumentEqual(settings.widgetSettings, orderBook.instrumentKey);
    if (!isInstrumentEqual(settings.widgetSettings, rowsState.instrumentKey)
      || !isOrderbookInstrumentCorrect
    ) {
      return this.regenerateRowsForHeight(
        isOrderbookInstrumentCorrect ? orderBook.rows : null,
        settings,
        getters,
        actions,
        priceRowsStore,
        rowHeight,
        scaleFactor,
        deps
      ).pipe(
        map(() => [])
      );
    }

    // инструмент не торгуется / нет данных
    if (rowsState.rows.length === 0 && rowsState.directionRowsCount === 0) {
      return of([]);
    }

    // цены были сгенерированы без ордербука или изменен масштаб
    if ((rowsState.isDirty && (orderBook.rows.b.length > 0 || orderBook.rows.a.length > 0)) || rowsState.priceOptions?.scaleFactor !== scaleFactor) {
      return this.regenerateRowsForHeight(
        orderBook.rows,
        settings,
        getters,
        actions,
        priceRowsStore,
        rowHeight,
        scaleFactor,
        deps
      ).pipe(
        map(() => [])
      );
    }

    // нет цен или не вся высота виджета заполнена
    if (rowsState.rows.length === 0
      || getters.isFillingByHeightNeeded(rowsState.rows, rowHeight)) {
      return this.regenerateRowsForHeight(
        orderBook.rows,
        settings,
        getters,
        actions,
        priceRowsStore,
        rowHeight,
        scaleFactor,
        deps
      ).pipe(
        map(() => [])
      );
    }

    // ордебук не помещается в текущий диапазон
    if (!this.checkPriceRowBounds(
      rowsState.rows,
      orderBook.rows,
      settings,
      getters,
      actions,
      priceRowsStore,
      rowHeight,
      scaleFactor
    )
    ) {
      return of([]);
    }

    const orderBookBounds = this.getOrderBookBounds(orderBook.rows);
    const rows: BodyRow[] = [];
    for (const row of rowsState.rows) {
      const mappedRow = this.mapPriceRowToOrderBook(
        row,
        rowsState.priceOptions.scaledStep,
        orderBook.rows,
        orderBookBounds,
        settings.widgetSettings
      );

      if (!mappedRow) {
        continue;
      }

      this.mapToPosition(mappedRow, position, orderBookBounds);

      rows.push(mappedRow);
    }

    return of(rows);
  }

  private static regenerateRowsForHeight(
    orderBookData: OrderbookData | null,
    settings: ScalperOrderBookExtendedSettings,
    getters: BodyGetters,
    actions: ChangeNotifications | null,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number,
    deps: DataContextBuilderDeps
  ): Observable<void> {
    actions?.priceRowsRegenerationStarted();

    let priceBounds$: Observable<{ asksRange: Range | null, bidsRange: Range | null } | null> | null = null;

    if (orderBookData) {
      const bounds = this.getOrderBookBounds(orderBookData);
      if (bounds.asksRange != null || bounds.bidsRange != null) {
        priceBounds$ = of(bounds);
      }
    }

    if (!priceBounds$) {
      priceBounds$ = deps.quotesService.getLastPrice(settings.widgetSettings, 1).pipe(
        map(lp => {
          if (lp != null) {
            return {
              asksRange: {
                min: lp,
                max: lp
              },
              bidsRange: {
                min: lp,
                max: lp
              },
            };
          }

          return null;
        })
      );
    }

    return priceBounds$.pipe(
      take(1),
      map(x => {
        priceRowsStore.initWithPriceRange(
          settings.widgetSettings,
          this.getPriceOptions(x, settings.instrument.minstep, scaleFactor, settings.widgetSettings.majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep),
          x == null || x.bidsRange?.max === x.asksRange?.min,
          getters.getVisibleRowsCount(rowHeight),
          () => {
            actions?.priceRowsRegenerationCompleted();
          }
        );

        return void 0;
      })
    );
  }

  private static getOrderBookBounds(orderBookData: OrderbookData): {
    asksRange: Range | null;
    bidsRange: Range | null;
  } {
    let asksRange: Range | null = null;
    if (orderBookData.a.length > 0) {
      asksRange = {
        min: orderBookData.a[0].p,
        max: orderBookData.a[orderBookData.a.length - 1].p
      };
    }

    let bidsRange: Range | null = null;
    if (orderBookData.b.length > 0) {
      bidsRange = {
        min: orderBookData.b[orderBookData.b.length - 1].p,
        max: orderBookData.b[0].p
      };
    }

    return {asksRange, bidsRange};
  }

  private static getPriceOptions(
    orderBookRange: { asksRange: Range | null, bidsRange: Range | null } | null,
    priceStep: number,
    scaleFactor: number,
    majorLinesStep: number
  ): PriceOptions | null {
    if (orderBookRange == null) {
      return null;
    }

    const bestAsk = orderBookRange.asksRange?.min ?? orderBookRange.bidsRange?.max;
    const bestBid = orderBookRange.bidsRange?.max ?? orderBookRange.asksRange?.min;
    const maxPrice = orderBookRange.asksRange?.max ?? orderBookRange.bidsRange?.max;
    const minPrice = orderBookRange.bidsRange?.min ?? orderBookRange.asksRange?.min;

    if (bestAsk == null || bestBid == null || maxPrice == null || minPrice == null) {
      return null;
    }

    const startPrice = OrderBookScaleHelper.getStartPrice(bestAsk, bestBid, priceStep, scaleFactor, majorLinesStep);

    return {
      startPrice: startPrice.startPrice,
      scaledStep: startPrice.step,
      basePriceStep: priceStep,
      scaleFactor,
      expectedRangeMin: Math.min(minPrice, startPrice.startPrice),
      expectedRangeMax: Math.max(maxPrice, startPrice.startPrice)
    };
  }

  private static checkPriceRowBounds(
    priceRows: PriceRow[],
    orderBookData: OrderbookData,
    settings: ScalperOrderBookExtendedSettings,
    getters: BodyGetters,
    actions: ChangeNotifications | null,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number
  ): boolean {
    const maxRowPrice = priceRows[0].price;
    const minRowPrice = priceRows[priceRows.length - 1].price;
    const orderBookBounds = this.getOrderBookBounds(orderBookData);

    const expectedMaxPrice = orderBookBounds.asksRange?.max ?? orderBookBounds.bidsRange?.max;
    const expectedMinPrice = orderBookBounds.bidsRange?.min ?? orderBookBounds.asksRange?.min;
    if ((expectedMinPrice != null && expectedMinPrice < minRowPrice)
      || (expectedMaxPrice != null && expectedMaxPrice > maxRowPrice)) {
      this.regenerateForOrderBook(orderBookData, settings, getters, actions, priceRowsStore, rowHeight, scaleFactor);
      return false;
    }

    return true;
  }

  private static regenerateForOrderBook(
    orderBookData: OrderbookData,
    settings: ScalperOrderBookExtendedSettings,
    getters: BodyGetters,
    actions: ChangeNotifications | null,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number
  ): void {
    actions?.priceRowsRegenerationStarted();

    const bounds = this.getOrderBookBounds(orderBookData);
    const expectedBestAsk = bounds.asksRange?.min ?? bounds.bidsRange?.max;
    const expectedBestBid = bounds.bidsRange?.max ?? bounds.asksRange?.min;

    if (expectedBestAsk == null || expectedBestBid == null) {
      return;
    }

    priceRowsStore.initWithPriceRange(
      settings.widgetSettings,
      this.getPriceOptions(
        this.getOrderBookBounds(orderBookData),
        settings.instrument.minstep,
        scaleFactor,
        settings.widgetSettings.majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep),
      false,
      getters.getVisibleRowsCount(rowHeight),
      () => {
        actions?.priceRowsRegenerationCompleted();
      }
    );
  }

  private static mapPriceRowToOrderBook(
    row: PriceRow,
    priceStep: number,
    orderBookData: OrderbookData,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null },
    settings: ScalperOrderBookWidgetSettings
  ): BodyRow | null {
    const priceStepPrecision = MathHelper.getPrecision(priceStep);
    const resultRow = {
      ...row,
      isMinorLinePrice: MathHelper.isMultipleOf(
        row.price,
        MathHelper.round(priceStep * (settings.minorLinesStep ?? ScalperOrderBookConstants.defaultMinorLinesStep), priceStepPrecision)
      ),
      isMajorLinePrice: MathHelper.isMultipleOf(
        row.price,
        MathHelper.round(priceStep * (settings.majorLinesStep ?? ScalperOrderBookConstants.defaultMajorLinesStep), priceStepPrecision)
      )
    } as BodyRow;

    if (!orderBookBounds.bidsRange && !orderBookBounds.asksRange) {
      return resultRow;
    }

    const matchRow = (targetRow: BodyRow, source: OrderbookDataRow[]): { volume: number, isBest: boolean } | null => {
      const matchedRows: { row: OrderbookDataRow, index: number }[] = [];

      for (let index = 0; index < source.length; index++) {
        const row = source[index];
        if (row.p >= targetRow.baseRange.min && row.p <= targetRow.baseRange.max) {
          matchedRows.push({row, index});

          if (targetRow.baseRange.min === targetRow.baseRange.max) {
            break;
          }
        }
      }

      if (matchedRows.length > 0) {
        return {
          volume: matchedRows.reduce((total, curr) => Math.round(total + curr.row.v), 0),
          isBest: matchedRows.some(r => r.index === 0)
        };
      }

      return null;
    };

    const isAskSide = orderBookBounds.asksRange != null && row.baseRange.max >= orderBookBounds.asksRange.min;
    const isBidSide = orderBookBounds.bidsRange != null && row.baseRange.min <= orderBookBounds.bidsRange.max;

    if (isAskSide && isBidSide) {
      resultRow.rowType = ScalperOrderBookRowType.Mixed;

      resultRow.askVolume = matchRow(resultRow, orderBookData.a)?.volume ?? 0;
      resultRow.bidVolume = matchRow(resultRow, orderBookData.b)?.volume ?? 0;
      resultRow.volume = Math.round(resultRow.askVolume + resultRow.bidVolume);
      resultRow.isBest = true;

      return resultRow;
    } else if (isAskSide) {
      resultRow.rowType = ScalperOrderBookRowType.Ask;
      if (resultRow.baseRange.min <= orderBookBounds.asksRange!.max) {
        const matched = matchRow(resultRow, orderBookData.a);
        if (matched == null) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          } else {
            return null;
          }
        } else {
          resultRow.volume = matched.volume;
          resultRow.askVolume = resultRow.volume;
          resultRow.isBest = matched.isBest;
        }
      }

      return resultRow;
    } else if (isBidSide) {
      resultRow.rowType = ScalperOrderBookRowType.Bid;
      if (resultRow.baseRange.max >= orderBookBounds.bidsRange!.min) {
        const matched = matchRow(resultRow, orderBookData.b);
        if (matched == null) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          } else {
            return null;
          }
        } else {
          resultRow.volume = matched.volume;
          resultRow.bidVolume = resultRow.volume;
          resultRow.isBest = matched.isBest;
        }
      }
      return resultRow;
    } else if (
      orderBookBounds.asksRange != null
      && orderBookBounds.bidsRange != null
      && settings.showSpreadItems) {
      resultRow.rowType = ScalperOrderBookRowType.Spread;
      return resultRow;
    } else if (orderBookBounds.asksRange == null || orderBookBounds.bidsRange == null) {
      return resultRow;
    }

    return null;
  }

  private static mapToPosition(
    targetRow: BodyRow,
    position: Position | null,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null }
  ): void {
    if (!!position && position.qtyTFuture !== 0) {
      const basePrice = position.qtyTFuture > 0
        ? orderBookBounds.bidsRange?.max ?? orderBookBounds.asksRange?.min
        : orderBookBounds.asksRange?.min ?? orderBookBounds.bidsRange?.max;

      if (basePrice == null) {
        return;
      }

      const sign = position.qtyTFuture > 0 ? 1 : -1;
      const currentPositionRangeSign = (basePrice! - position.avgPrice) * sign;

      const isCurrentPositionRange = (targetRow.price <= basePrice! && targetRow.price >= position.avgPrice)
        || (targetRow.price >= basePrice! && targetRow.price <= position.avgPrice);

      targetRow.currentPositionRangeSign = isCurrentPositionRange
        ? currentPositionRangeSign
        : null;
    }
  }

  private static getCurrentOrdersStream(
    settings$: Observable<ScalperOrderBookExtendedSettings>,
    currentPortfolio$: Observable<PortfolioKey>,
    localOrders$: Observable<Map<string, LocalOrder>>,
    deps: DataContextBuilderDeps
  ): Observable<CurrentOrderDisplay[]> {
    const limitOrders$ = settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      mapWith(() => currentPortfolio$, (s, p) => ({s, p})),
      mapWith(
        ({p}) => deps.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange),
        (source, orders) => {
          return orders.allOrders.filter(o => o.targetInstrument.symbol === source.s.widgetSettings.symbol
            && o.targetInstrument.exchange === source.s.widgetSettings.exchange
            && o.status === 'working');
        }
      ),
      map(orders => orders.map(x => ({
        orderId: x.id,
        targetInstrument: x.targetInstrument,
        ownedPortfolio: x.ownedPortfolio,
        type: x.type,
        side: x.side,
        price: x.price,
        displayVolume: x.qty - (x.filledQtyBatch ?? 0),
        meta: this.getOrderMeta(x),
        isDirty: false
      } as CurrentOrderDisplay))),
      shareReplay({bufferSize: 1, refCount: true})
    );

    const stopOrders$ = settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      mapWith(() => currentPortfolio$, (s, p) => ({s, p})),
      mapWith(
        ({p}) => deps.portfolioSubscriptionsService.getStopOrdersSubscription(p.portfolio, p.exchange),
        (source, orders) => {
          return orders.allOrders.filter(o => o.targetInstrument.symbol === source.s.widgetSettings.symbol
            && o.targetInstrument.exchange === source.s.widgetSettings.exchange
            && o.status === 'working');
        }
      ),
      map(orders => orders.map(x => ({
        orderId: x.id,
        targetInstrument: x.targetInstrument,
        ownedPortfolio: x.ownedPortfolio,
        type: x.type,
        side: x.side,
        triggerPrice: x.triggerPrice,
        price: x.price,
        condition: x.conditionType,
        displayVolume: x.qty - (x.filledQtyBatch ?? 0),
        meta: this.getOrderMeta(x),
        isDirty: false
      } as CurrentOrderDisplay))),
      shareReplay({bufferSize: 1, refCount: true})
    );

    const currentInstrumentLocalOrders$ = settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      mapWith(() => currentPortfolio$, (s, p) => ({s, p})),
      mapWith(
        () => localOrders$,
        (source, output) => ({...source, localOrders: output})
      ),
      map(x => {
        return Array.from(x.localOrders.values())
          .filter(o => {
            return isInstrumentEqual(o.targetInstrument, x.s.widgetSettings)
              && o.ownedPortfolio.portfolio === x.p.portfolio
              && o.ownedPortfolio.exchange === x.p.exchange;
          });
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );

    return combineLatest({
      limitOrders: limitOrders$,
      stopOrders: stopOrders$,
      localOrders: currentInstrumentLocalOrders$
    }).pipe(
      map(x => {
        const actualOrders = [...x.limitOrders, ...x.stopOrders];

        const metas = new Set<string>();
        for (const actualOrder of actualOrders) {
          if (actualOrder.meta?.trackId != null) {
            metas.add(actualOrder.meta.trackId);
          }
        }

        const filteredLocalOrders = x.localOrders.filter(o => !metas.has(o.orderId));

        return [
          ...actualOrders,
          ...filteredLocalOrders
        ];
      }),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private static getOrderMeta(order: Order): OrderMeta | undefined {
    const comment = order.comment ?? '';

    if (comment.includes('meta')) {
      try {
        const meta = JSON.parse(comment) as { meta: OrderMeta };
        return meta.meta;
      } catch {
      }
    }

    return undefined;
  }

  private static getInstrumentTradesStream(
    deps: DataContextBuilderDeps,
    settings$: Observable<ScalperOrderBookExtendedSettings>,
    depth = 1000
  ): Observable<AllTradesItem[]> {
    let results: AllTradesItem[] = [];

    const getTrades = (instrumentKey: InstrumentKey): Observable<AllTradesItem | null> => deps.allTradesService.getNewTradesSubscription(instrumentKey, 100).pipe(
      startWith(null)
    );

    return settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      tap(() => {
        results = [];
      }),
      switchMap(x => getTrades(x.widgetSettings)),
      map(trade => {
        if (trade != null) {
          results.push(trade);

          if (results.length > depth) {
            results = results.slice(-depth);
          }
        }

        return results;
      }),
      startWith([]),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  private static getOwnTradesStream(
    settings$: Observable<ScalperOrderBookExtendedSettings>,
    currentPortfolio$: Observable<PortfolioKey>,
    deps: DataContextBuilderDeps
  ): Observable<Trade[]> {
    const getInstrumentTrades = (portfolioKey: PortfolioKey, instrumentKey: InstrumentKey): Observable<Trade[]> => {
      return deps.portfolioSubscriptionsService.getTradesSubscription(portfolioKey.portfolio, portfolioKey.exchange).pipe(
        map(t => t.filter(i => i.targetInstrument.symbol === instrumentKey.symbol && i.targetInstrument.exchange === instrumentKey.exchange))
      );
    };

    return settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      mapWith(() => currentPortfolio$, (s, p) => ({s, p})),
      switchMap(x => getInstrumentTrades(x.p, x.s.widgetSettings)),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
