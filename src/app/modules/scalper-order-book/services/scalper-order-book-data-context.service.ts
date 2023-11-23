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
  PriceRowsState,
  PriceRowsStore
} from '../utils/price-rows-store';
import { isInstrumentEqual } from '../../../shared/utils/settings-helper';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { QuotesService } from '../../../shared/services/quotes.service';
import { ScalperSettingsHelper } from "../utils/scalper-settings.helper";


export interface ContextGetters {
  getVisibleRowsCount: () => number,
  isFillingByHeightNeeded: (currentRows: PriceRow[]) => boolean
}

export interface ContextChangeActions {
  priceRowsRegenerationStarted: () => void,
  priceRowsRegenerationCompleted: () => void,
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
    getters: ContextGetters,
    actions: ContextChangeActions
  ): Omit<ScalperOrderBookDataContext, 'displayRange$' | 'workingVolume$'> {
    const settings$ = this.getSettingsStream(widgetGuid);
    const currentPortfolio$ = this.getOrderBookPortfolio();
    const position$ = this.getOrderBookPositionStream(settings$, currentPortfolio$);
    const orderBookData$ = this.getOrderBookDataStream(settings$);

    return {
      extendedSettings$: settings$,
      currentPortfolio$: currentPortfolio$,
      position$: position$,
      orderBookData$: orderBookData$.pipe(
        map(x => x.data)
      ),
      orderBookBody$: this.getOrderBookBody(
        settings$,
        priceRowsStore,
        orderBookData$,
        position$,
        contentSize$,
        getters,
        actions
      ),
      currentOrders$: this.getCurrentOrdersStream(settings$, currentPortfolio$),
      trades$: this.getInstrumentTradesStream(settings$)
    };
  }

  public getOrderBookBounds(orderBookData: OrderbookData): { asksRange: Range | null, bidsRange: Range | null } {
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
      filter(x => !!x.instrument),
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
      map(p => (!p || !p.avgPrice ? null as any : p)),
      startWith(null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  public getOrderBookDataStream(settings$: Observable<ScalperOrderBookExtendedSettings>): Observable<{ instrumentKey: InstrumentKey, data: OrderbookData }> {
    const getOrderBookData = (settings: ScalperOrderBookExtendedSettings) => this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
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
        settings => getOrderBookData(settings),
        (settings, data) => ({ instrumentKey: settings.widgetSettings, data })
      ),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private getInstrumentTradesStream(settings$: Observable<ScalperOrderBookExtendedSettings>, depth = 1000): Observable<AllTradesItem[]> {
    let results: AllTradesItem[] = [];

    return settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev?.widgetSettings, curr?.widgetSettings)),
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
    orderBookData$: Observable<{ instrumentKey: InstrumentKey, data: OrderbookData }>,
    position$: Observable<Position | null>,
    contentSize$: Observable<ContentSize | null>,
    getters: ContextGetters,
    actions: ContextChangeActions
  ): Observable<BodyRow[]> {
    return combineLatest([
      extendedSettings$,
      priceRowsStore.state$,
      orderBookData$,
      position$,
      contentSize$

    ]).pipe(
      map(([settings, rowsState, orderBookData, position]) => {
        return this.mapToBodyRows(
          settings,
          rowsState,
          orderBookData,
          position,
          getters,
          actions,
          priceRowsStore
        ) ?? [];
      }),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private mapToBodyRows(
    settings: ScalperOrderBookExtendedSettings,
    rowsState: PriceRowsState,
    orderBookData: { instrumentKey: InstrumentKey, data: OrderbookData },
    position: Position | null,
    getters: ContextGetters,
    actions: ContextChangeActions,
    priceRowsStore: PriceRowsStore
  ): BodyRow[] | null {
    if (!isInstrumentEqual(settings.widgetSettings, rowsState.instrumentKey)
      || !isInstrumentEqual(settings.widgetSettings, orderBookData.instrumentKey)
    ) {
      this.regenerateRowsForHeight(null, settings, getters, actions, priceRowsStore);
      return [];
    }

    if(rowsState.rows.length === 0 && rowsState.directionRowsCount === 0) {
      return [];
    }

    if (rowsState.rows.length === 0
      || getters.isFillingByHeightNeeded(rowsState.rows)) {
      this.regenerateRowsForHeight(orderBookData.data, settings, getters, actions, priceRowsStore);
      return [];
    }

    if (!this.checkPriceRowBounds(
      rowsState.rows,
      orderBookData.data,
      settings,
      getters,
      actions,
      priceRowsStore
    )
    ) {
      return [];
    }

    const orderBookBounds = this.getOrderBookBounds(orderBookData.data);
    const rows: BodyRow[] = [];
    for (let i = 0; i < rowsState.rows.length; i++) {
      const mappedRow = this.mapPriceRowToOrderBook(
        rowsState.rows[i],
        orderBookData.data,
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
    priceRowsStore: PriceRowsStore
  ) {
    actions.priceRowsRegenerationStarted();

    let priceBounds$: Observable<{ min: number, max: number } | null> | null = null;

    if (orderBookData) {
      const bounds = this.getOrderBookBounds(orderBookData);
      const expectedMaxPrice = bounds.asksRange?.max ?? bounds.bidsRange?.max;
      const expectedMinPrice = bounds.bidsRange?.min ?? bounds.asksRange?.min;

      if (expectedMaxPrice != null && expectedMinPrice != null) {
        priceBounds$ = of({ min: expectedMinPrice, max: expectedMaxPrice });
      }
    }

    if (!priceBounds$) {
      priceBounds$ = this.quotesService.getLastPrice(settings.widgetSettings, 1).pipe(
        map(lp => {
          if(lp != null) {
            return { min: lp!, max: lp! };
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
        !!x
          ? {
            min: x.min,
            max: x.max

          }
          : null,
        settings.instrument.minstep,
        getters.getVisibleRowsCount(),
        () => {
          actions.priceRowsRegenerationCompleted();
        }
      );
    });
  }

  private regeneratePriceRows(
    orderBookData: OrderbookData,
    settings: ScalperOrderBookExtendedSettings,
    getters: ContextGetters,
    actions: ContextChangeActions,
    priceRowsStore: PriceRowsStore
  ) {
    actions.priceRowsRegenerationStarted();

    const bounds = this.getOrderBookBounds(orderBookData);
    const expectedMaxPrice = bounds.asksRange?.max ?? bounds.bidsRange?.max;
    const expectedMinPrice = bounds.bidsRange?.min ?? bounds.asksRange?.min;

    if (!expectedMaxPrice || !expectedMinPrice) {
      return;
    }

    priceRowsStore.initWithPriceRange(
      settings.widgetSettings,
      {
        min: expectedMinPrice,
        max: expectedMaxPrice
      },
      settings.instrument.minstep,
      getters.getVisibleRowsCount(),
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
    priceRowsStore: PriceRowsStore
  ): boolean {
    const maxRowPrice = priceRows[0].price;
    const minRowPrice = priceRows[priceRows.length - 1].price;
    const orderBookBounds = this.getOrderBookBounds(orderBookData);

    const expectedMaxPrice = orderBookBounds.asksRange?.max ?? orderBookBounds.bidsRange?.max;
    const expectedMinPrice = orderBookBounds.bidsRange?.min ?? orderBookBounds.asksRange?.min;
    if ((!!expectedMinPrice && expectedMinPrice < minRowPrice)
      || (!!expectedMaxPrice && expectedMaxPrice > maxRowPrice)) {
      this.regeneratePriceRows(orderBookData, settings, getters, actions, priceRowsStore);
      return false;
    }

    return true;
  }

  private mapPriceRowToOrderBook(
    row: PriceRow,
    orderBookData: OrderbookData,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null },
    settings: ScalperOrderBookWidgetSettings,
  ): BodyRow | null {
    const resultRow = {
      ...row
    } as BodyRow;

    if (!orderBookBounds.bidsRange && !orderBookBounds.asksRange) {
      return resultRow;
    }

    const matchRow = (targetRow: BodyRow, source: OrderbookDataRow[]) => {
      const matchedRowIndex = source.findIndex(x => x.p === targetRow.price);
      if (matchedRowIndex >= 0) {
        const matchedRow = source[matchedRowIndex];
        targetRow.volume = matchedRow.v;
        targetRow.isBest = matchedRowIndex === 0;

        return true;
      }

      return false;
    };

    if (orderBookBounds.asksRange && row.price >= orderBookBounds.asksRange.min) {
      resultRow.rowType = ScalperOrderBookRowType.Ask;
      if (resultRow.price <= orderBookBounds.asksRange.max) {
        if (!matchRow(resultRow, orderBookData.a)) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          }
          else {
            return null;
          }
        }
      }

      return resultRow;
    }
    else if (orderBookBounds.bidsRange && row.price <= orderBookBounds.bidsRange.max) {
      resultRow.rowType = ScalperOrderBookRowType.Bid;
      if (resultRow.price >= orderBookBounds.bidsRange.min) {
        if (!matchRow(resultRow, orderBookData.b)) {
          if (settings.showZeroVolumeItems) {
            resultRow.isFiller = true;
          }
          else {
            return null;
          }
        }
      }
      return resultRow;
    }
    else if (settings.showSpreadItems) {
      resultRow.rowType = ScalperOrderBookRowType.Spread;
      return resultRow;
    }

    return null;
  }

  private mapToPosition(
    targetRow: BodyRow,
    position: Position | null,
    orderBookBounds: { asksRange: Range | null, bidsRange: Range | null }
  ) {
    if (!!position && position.qtyTFuture !== 0) {
      const basePrice = position.qtyTFuture > 0
        ? orderBookBounds.bidsRange?.max ?? orderBookBounds.asksRange?.min
        : orderBookBounds.asksRange?.min ?? orderBookBounds.bidsRange?.max;

      if (!basePrice) {
        return;
      }

      const sign = position.qtyTFuture > 0 ? 1 : -1;
      const currentPositionRangeSign = (basePrice - position.avgPrice) * sign;

      const isCurrentPositionRange = targetRow.price <= basePrice && targetRow.price >= position.avgPrice
        || (targetRow.price >= basePrice && targetRow.price <= position.avgPrice);

      targetRow.currentPositionRangeSign = isCurrentPositionRange
        ? currentPositionRangeSign
        : null;
    }
  }
}
