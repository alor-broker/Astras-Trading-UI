import { Injectable } from '@angular/core';
import {
  combineLatest,
  distinctUntilChanged,
  filter,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  OrderBook,
  ScalperOrderBookDataContext,
  ScalperOrderBookExtendedSettings
} from '../models/scalper-order-book-data-context.model';
import { mapWith } from '../../../shared/utils/observable-helper';
import { WidgetSettingsService } from '../../../shared/services/widget-settings.service';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import {
  map,
  startWith
} from 'rxjs/operators';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { OrderBookDataFeedHelper } from '../../orderbook/utils/order-book-data-feed.helper';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import {
  BodyRow,
  CurrentOrderDisplay,
  PriceRow,
  ScalperOrderBookRowType
} from '../models/scalper-order-book.model';
import { Range } from '../../../shared/models/common.model';
import { ScalperOrderBookWidgetSettings } from '../models/scalper-order-book-settings.model';
import {
  OrderbookData,
  OrderbookDataRow,
  OrderbookRequest
} from '../../orderbook/models/orderbook-data.model';
import { AllTradesItem } from '../../../shared/models/all-trades.model';
import { AllTradesService } from '../../../shared/services/all-trades.service';
import { ContentSize } from '../../../shared/models/dashboard/dashboard-item.model';
import {
  PriceOptions,
  PriceRowsState,
  PriceRowsStore
} from '../utils/price-rows-store';
import { isInstrumentEqual } from '../../../shared/utils/settings-helper';
import { QuotesService } from '../../../shared/services/quotes.service';
import { ScalperSettingsHelper } from "../utils/scalper-settings.helper";
import { Instrument } from "../../../shared/models/instruments/instrument.model";
import { OrderBookScaleHelper } from "../utils/order-book-scale.helper";


export interface ContextGetters {
  getVisibleRowsCount: (rowHeight: number) => number;
  isFillingByHeightNeeded: (currentRows: PriceRow[], rowHeight: number) => boolean;
}

export interface ContextChangeActions {
  priceRowsRegenerationStarted: () => void;
  priceRowsRegenerationCompleted: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class ScalperOrderBookDataContextService {

  constructor(
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly instrumentsService: InstrumentsService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly allTradesService: AllTradesService,
    private readonly quotesService: QuotesService,
  ) {
  }

  createContext(
    widgetGuid: string,
    priceRowsStore: PriceRowsStore,
    contentSize$: Observable<ContentSize | null>,
    rowHeight$: Observable<number>,
    scaleFactor$: Observable<number>,
    getters: ContextGetters,
    actions: ContextChangeActions
  ): Omit<ScalperOrderBookDataContext, 'displayRange$' | 'workingVolume$'> {
    const settings$ = this.getSettingsStream(widgetGuid);
    const currentPortfolio$ = this.getOrderBookPortfolio();
    const position$ = this.getOrderBookPositionStream(settings$, currentPortfolio$);
    const orderBook$ = this.getOrderBookStream(settings$);

    return {
      extendedSettings$: settings$,
      currentPortfolio$: currentPortfolio$,
      position$: position$,
      orderBook$: orderBook$,
      orderBookBody$: this.getOrderBookBody(
        settings$,
        priceRowsStore,
        orderBook$,
        position$,
        contentSize$,
        rowHeight$,
        scaleFactor$,
        getters,
        actions
      ),
      currentOrders$: this.getCurrentOrdersStream(settings$, currentPortfolio$),
      trades$: this.getInstrumentTradesStream(settings$),
      scaleFactor$
    };
  }

  private getOrderBookBounds(orderBookData: OrderbookData): { asksRange: Range | null, bidsRange: Range | null } {
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

    return { asksRange, bidsRange };
  }

  public getOrderBookPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }

  public getSettingsStream(widgetGuid: string): Observable<ScalperOrderBookExtendedSettings> {
    return ScalperSettingsHelper.getSettingsStream(widgetGuid, this.widgetSettingsService).pipe(
      mapWith(
        settings => this.instrumentsService.getInstrument(settings),
        (widgetSettings, instrument) => ({ widgetSettings, instrument } as ScalperOrderBookExtendedSettings)
      ),
      filter(x => !!(x.instrument as Instrument | null)),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  public getOrderBookPositionStream(settings$: Observable<ScalperOrderBookExtendedSettings>, currentPortfolio$: Observable<PortfolioKey>): Observable<Position | null> {
    return settings$.pipe(
      mapWith(
        () => currentPortfolio$,
        (settings, portfolio) => ({ settings, portfolio })
      ),
      mapWith(
        x => this.portfolioSubscriptionsService.getAllPositionsSubscription(x.portfolio.portfolio, x.portfolio.exchange),
        (source, positions) => ({ ...source, positions })
      ),
      map(s => s.positions.find(p => p.symbol === s.settings.widgetSettings.symbol && p.exchange === s.settings.widgetSettings.exchange)),
      map(p => (!p || !p.avgPrice ? null : p as Position)),
      startWith(null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  public getOrderBookStream(settings$: Observable<ScalperOrderBookExtendedSettings>): Observable<OrderBook> {
    const getOrderBook = (settings: ScalperOrderBookExtendedSettings): Observable<OrderbookData> => this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
      OrderBookDataFeedHelper.getRealtimeDateRequest(
        settings.widgetSettings.symbol,
        settings.widgetSettings.exchange,
        settings.widgetSettings.instrumentGroup,
        settings.widgetSettings.depth
      ),
      OrderBookDataFeedHelper.getOrderbookSubscriptionId
    ).pipe(
      startWith(({
        a: [],
        b: []
      } as OrderbookData)),
    );

    return settings$.pipe(
      mapWith(
        settings => getOrderBook(settings),
        (settings, rows) => ({ instrumentKey: settings.widgetSettings, rows })
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getInstrumentTradesStream(settings$: Observable<ScalperOrderBookExtendedSettings>, depth = 1000): Observable<AllTradesItem[]> {
    let results: AllTradesItem[] = [];

    return settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      tap(() => {
        results = [];
      }),
      switchMap(x => this.allTradesService.getNewTradesSubscription(x.widgetSettings, 100)),
      map(trade => {
        results.push(trade);

        if(results.length > depth) {
          results = results.slice(-depth);
        }

        return results;
      }),
      startWith([]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getCurrentOrdersStream(settings$: Observable<ScalperOrderBookExtendedSettings>, currentPortfolio$: Observable<PortfolioKey>): Observable<CurrentOrderDisplay[]> {
    const limitOrders$ = settings$.pipe(
      mapWith(() => currentPortfolio$, (s, p) => ({ s, p })),
      mapWith(
        ({ p }) => this.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange),
        (source, orders) => {
          return orders.allOrders.filter(o => o.symbol === source.s.widgetSettings.symbol
            && o.exchange === source.s.widgetSettings.exchange
            && o.status === 'working');
        }
      ),
      map(orders => orders.map(x => ({
        orderId: x.id,
        symbol: x.symbol,
        exchange: x.exchange,
        portfolio: x.portfolio,
        type: 'limit',
        side: x.side,
        linkedPrice: x.price,
        displayVolume: x.qty - (x.filledQtyBatch ?? 0)
      } as CurrentOrderDisplay))),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    const stopOrders$ = settings$.pipe(
      mapWith(() => currentPortfolio$, (s, p) => ({ s, p })),
      mapWith(
        ({ p }) => this.portfolioSubscriptionsService.getStopOrdersSubscription(p.portfolio, p.exchange),
        (source, orders) => {
          return orders.allOrders.filter(o => o.symbol === source.s.widgetSettings.symbol
            && o.exchange === source.s.widgetSettings.exchange
            && o.status === 'working');
        }
      ),
      map(orders => orders.map(x => ({
        orderId: x.id,
        exchange: x.exchange,
        portfolio: x.portfolio,
        type: x.type,
        side: x.side,
        linkedPrice: x.triggerPrice,
        displayVolume: x.qty - (x.filledQtyBatch ?? 0)
      } as CurrentOrderDisplay))),
      shareReplay({ bufferSize: 1, refCount: true })
    );

    return combineLatest([
      limitOrders$,
      stopOrders$
    ]).pipe(
      map(([limitOrders, stopOrders]) => [...limitOrders, ...stopOrders]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getOrderBookBody(
    extendedSettings$: Observable<ScalperOrderBookExtendedSettings>,
    priceRowsStore: PriceRowsStore,
    orderBookData$: Observable<OrderBook>,
    position$: Observable<Position | null>,
    contentSize$: Observable<ContentSize | null>,
    rowHeight$: Observable<number>,
    scaleFactor$: Observable<number>,
    getters: ContextGetters,
    actions: ContextChangeActions
  ): Observable<BodyRow[]> {
    return combineLatest([
      extendedSettings$,
      priceRowsStore.state$,
      orderBookData$,
      position$,
      contentSize$,
      rowHeight$,
      scaleFactor$
    ]).pipe(
      map(([settings, rowsState, orderBook, position, ,rowHeight, scaleFactor]) => {
        return this.mapToBodyRows(
          settings,
          rowsState,
          orderBook,
          position,
          getters,
          actions,
          priceRowsStore,
          rowHeight,
          scaleFactor
        ) ?? [];
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private mapToBodyRows(
    settings: ScalperOrderBookExtendedSettings,
    rowsState: PriceRowsState,
    orderBook: OrderBook,
    position: Position | null,
    getters: ContextGetters,
    actions: ContextChangeActions,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number
  ): BodyRow[] | null {
    // цены или ордербук от другого инструмента
    if (!isInstrumentEqual(settings.widgetSettings, rowsState.instrumentKey)
      || !isInstrumentEqual(settings.widgetSettings, orderBook.instrumentKey)
    ) {
      this.regenerateRowsForHeight(null, settings, getters, actions, priceRowsStore, rowHeight, scaleFactor);
      return [];
    }

    // инструмент не торгуется
    if(rowsState.rows.length === 0 && rowsState.directionRowsCount === 0) {
      return [];
    }

    // цены были сгенерированы без ордербука или изменен масштаб
    if (rowsState.isDirty && (orderBook.rows.b.length > 0 || orderBook.rows.a.length > 0) || rowsState.priceOptions?.scaleFactor !== scaleFactor)
     {
      this.regenerateRowsForHeight(orderBook.rows, settings, getters, actions, priceRowsStore, rowHeight, scaleFactor);
      return [];
    }

    // нет цен или не вся высота виджета заполнена
    if (rowsState.rows.length === 0
      || getters.isFillingByHeightNeeded(rowsState.rows, rowHeight)) {
      this.regenerateRowsForHeight(orderBook.rows, settings, getters, actions, priceRowsStore, rowHeight, scaleFactor);
      return [];
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
      return [];
    }

    const orderBookBounds = this.getOrderBookBounds(orderBook.rows);
    const rows: BodyRow[] = [];
    for (let i = 0; i < rowsState.rows.length; i++) {
      const mappedRow = this.mapPriceRowToOrderBook(
        rowsState.rows[i],
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

    return rows;
  }

  private regenerateRowsForHeight(
    orderBookData: OrderbookData | null,
    settings: ScalperOrderBookExtendedSettings,
    getters: ContextGetters,
    actions: ContextChangeActions,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number
  ): void {
    actions.priceRowsRegenerationStarted();

    let priceBounds$: Observable<{ asksRange: Range | null, bidsRange: Range | null } | null> | null = null;

    if (orderBookData) {
      const bounds = this.getOrderBookBounds(orderBookData);
      if (bounds.asksRange != null || bounds.bidsRange != null) {
        priceBounds$ = of(bounds);
      }
    }

    if (!priceBounds$) {
      priceBounds$ = this.quotesService.getLastPrice(settings.widgetSettings, 1).pipe(
        map(lp => {
          if(lp != null) {
            return {
              asksRange:{
                min: lp,
                max: lp
              },
              bidsRange:{
                min: lp,
                max: lp
              },
            };
          }

          return null;
        })
      );
    }

    priceBounds$.pipe(
      take(1)
    ).subscribe(x => {
      priceRowsStore.initWithPriceRange(
        settings.widgetSettings,
        this.getPriceOptions(x, settings.instrument.minstep, scaleFactor),
        x == null,
        getters.getVisibleRowsCount(rowHeight),
        () => {
          actions.priceRowsRegenerationCompleted();
        }
      );
    });
  }

  private getPriceOptions(orderBookRange: { asksRange: Range | null, bidsRange: Range | null } | null, priceStep: number, scaleFactor: number): PriceOptions | null {
    if(orderBookRange == null) {
      return null;
    }

    const bestAsk = orderBookRange.asksRange?.min ?? orderBookRange.bidsRange?.max;
    const bestBid = orderBookRange.bidsRange?.max ?? orderBookRange.asksRange?.min;
    const maxPrice = orderBookRange.asksRange?.max ?? orderBookRange.bidsRange?.max;
    const minPrice = orderBookRange.bidsRange?.min ?? orderBookRange.asksRange?.min;

    if(bestAsk == null || bestBid == null || maxPrice == null || minPrice == null) {
      return null;
    }

    const startPrice = OrderBookScaleHelper.getStartPrice(bestAsk, bestBid, priceStep, scaleFactor);

    return {
      startPrice: startPrice.startPrice,
      scaledStep: startPrice.step,
      basePriceStep: priceStep,
      scaleFactor,
      expectedRangeMin: minPrice,
      expectedRangeMax: maxPrice
    };
  }

  private regenerateForOrderBook(
    orderBookData: OrderbookData,
    settings: ScalperOrderBookExtendedSettings,
    getters: ContextGetters,
    actions: ContextChangeActions,
    priceRowsStore: PriceRowsStore,
    rowHeight: number,
    scaleFactor: number
  ): void {
    actions.priceRowsRegenerationStarted();

    const bounds = this.getOrderBookBounds(orderBookData);
    const expectedBestAsk = bounds.asksRange?.min ?? bounds.bidsRange?.max;
    const expectedBestBid = bounds.bidsRange?.max ?? bounds.asksRange?.min;

    if (expectedBestAsk == null || expectedBestBid == null) {
      return;
    }

    priceRowsStore.initWithPriceRange(
      settings.widgetSettings,
      this.getPriceOptions(this.getOrderBookBounds(orderBookData), settings.instrument.minstep, scaleFactor),
      false,
      getters.getVisibleRowsCount(rowHeight),
      () => {
        actions.priceRowsRegenerationCompleted();
      }
    );
  }

  private checkPriceRowBounds(
    priceRows: PriceRow[],
    orderBookData: OrderbookData,
    settings: ScalperOrderBookExtendedSettings,
    getters: ContextGetters,
    actions: ContextChangeActions,
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

  private mapPriceRowToOrderBook(
    row: PriceRow,
    orderBookData: OrderbookData,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null },
    settings: ScalperOrderBookWidgetSettings
  ): BodyRow | null {
    const resultRow = {
      ...row
    } as BodyRow;

    if (!orderBookBounds.bidsRange && !orderBookBounds.asksRange) {
      return resultRow;
    }

    const matchRow = (targetRow: BodyRow, source: OrderbookDataRow[]): { volume: number, isBest: boolean} | null => {
      const matchedRows: {row: OrderbookDataRow, index: number}[] = [];

      for(let index = 0; index < source.length; index++) {
        const row = source[index];
        if(row.p >= targetRow.baseRange.min && row.p <= targetRow.baseRange.max) {
          matchedRows.push({row, index});

          if(targetRow.baseRange.min === targetRow.baseRange.max) {
            break;
          }
        }
      }

      if(matchedRows.length > 0) {
        return {
          volume: matchedRows.reduce((total, curr) => Math.round(total + curr.row.v), 0),
          isBest: matchedRows.some(r=> r.index === 0)
        };
      }

      return null;
    };

    const isAskSide = orderBookBounds.asksRange != null && row.baseRange.max >= orderBookBounds.asksRange.min;
    const isBidSide = orderBookBounds.bidsRange != null && row.baseRange.min <= orderBookBounds.bidsRange.max;

    if(isAskSide && isBidSide) {
      resultRow.rowType = ScalperOrderBookRowType.Mixed;

      resultRow.askVolume = matchRow(resultRow, orderBookData.a)?.volume ?? 0;
      resultRow.bidVolume = matchRow(resultRow, orderBookData.b)?.volume ?? 0;
      resultRow.volume = Math.round(resultRow.askVolume + resultRow.bidVolume);
      resultRow.isBest = true;

      return resultRow;
    } else if(isAskSide) {
      resultRow.rowType = ScalperOrderBookRowType.Ask;
      if (resultRow.baseRange.min <= orderBookBounds.asksRange!.max) {
        const matched = matchRow(resultRow, orderBookData.a);
        if (matched == null) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          }
          else {
            return null;
          }
        } else {
          resultRow.volume = matched.volume;
          resultRow.askVolume = resultRow.volume;
          resultRow.isBest = matched.isBest;
        }
      }

      return resultRow;
    } else if(isBidSide) {
      resultRow.rowType = ScalperOrderBookRowType.Bid;
      if (resultRow.baseRange.max >= orderBookBounds.bidsRange!.min) {
        const matched = matchRow(resultRow, orderBookData.b);
        if (matched == null) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          }
          else {
            return null;
          }
        } else {
          resultRow.volume = matched.volume;
          resultRow.bidVolume = resultRow.volume;
          resultRow.isBest = matched.isBest;
        }
      }
      return resultRow;
    } else if (settings.showSpreadItems) {
      resultRow.rowType = ScalperOrderBookRowType.Spread;
      return resultRow;
    }

    return null;
  }

  private mapToPosition(
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

      const isCurrentPositionRange = targetRow.price <= basePrice! && targetRow.price >= position.avgPrice
        || (targetRow.price >= basePrice! && targetRow.price <= position.avgPrice);

      targetRow.currentPositionRangeSign = isCurrentPositionRange
        ? currentPositionRangeSign
        : null;
    }
  }
}
