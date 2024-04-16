import { Injectable } from '@angular/core';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {
  combineLatest,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import { CommonSummaryModel } from '../../modules/blotter/models/common-summary.model';
import { ForwardRisks } from '../../modules/blotter/models/forward-risks.model';
import { Trade } from '../models/trades/trade.model';
import {
  finalize,
  map,
  startWith
} from 'rxjs/operators';
import { catchHttpError, mapWith } from '../utils/observable-helper';
import { Position } from '../models/positions/position.model';
import {Order, StopOrder, StopOrderResponse} from '../models/orders/order.model';
import {PortfolioKey} from "../models/portfolio-key.model";
import {InstrumentKey} from "../models/instruments/instrument-key.model";
import { HttpClient } from "@angular/common/http";
import { EnvironmentService } from "./environment.service";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

interface PortfolioRequestBase {
  opcode: string;
  portfolio: string;
  exchange: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioSubscriptionsService {
  private readonly subscriptions = new Map<string, Observable<any>>;
  private readonly baseUrl = this.environmentService.apiUrl + '/md/v2/Clients';

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
  ) {
  }

  getSummariesSubscription(portfolio: string, exchange: string): Observable<CommonSummaryModel> {
    return this.subscriptionsDataFeedService.subscribe({
        opcode: 'SummariesGetAndSubscribeV2',
        portfolio,
        exchange
      },
      this.getSubscriptionKey
    );
  }

  getSpectraRisksSubscription(portfolio: string, exchange: string): Observable<ForwardRisks> {
    return this.subscriptionsDataFeedService.subscribe({
        opcode: 'SpectraRisksGetAndSubscribe',
        portfolio,
        exchange
      },
      this.getSubscriptionKey
    );
  }

  getTradesSubscription(portfolio: string, exchange: string): Observable<Trade[]> {
    const getTradeWithDates = (t: Trade): Trade => ({
      ...t,
      date: new Date(t.date)
    });

    return this.getOrCreateSubscription(
      {
        opcode: 'TradesGetAndSubscribeV2',
        skipHistory: true,
        portfolio,
        exchange
      },
      request => of({
        allTrades: new Map<string, Trade>(),
        isHistoryFilled: false
      })
        .pipe(
          mapWith(
            () => combineLatest([
              this.subscriptionsDataFeedService.subscribe<any, Trade>(request, this.getSubscriptionKey)
                .pipe(
                  startWith(null)
                ),
              this.getCurrentSessionTrades(portfolio, exchange)
                .pipe(
                  startWith(null)
                )
            ]),
            (state, [subscriptionTrade, tradesHistory]) => ({
              state,
              subscriptionTrade,
              tradesHistory
            })
          ),
          map(({ state, subscriptionTrade, tradesHistory }) => {
            if (!state.isHistoryFilled && (tradesHistory ?? []).length > 0) {
              tradesHistory!.forEach(t => {
                if (state.allTrades.get(t.id) != null) {
                  return;
                }

                state.allTrades.set(t.id, getTradeWithDates(t));
              });

              state.isHistoryFilled = true;
            }

            if (subscriptionTrade != null) {
              state.allTrades.set(subscriptionTrade.id, getTradeWithDates(subscriptionTrade));
            }

            return Array.from(state.allTrades.values());
          })
        )
    );
  }

  getAllPositionsSubscription(portfolio: string, exchange: string): Observable<Position[]> {
    return this.getOrCreateSubscription(
      {
        opcode: 'PositionsGetAndSubscribeV2',
        portfolio,
        exchange
      },
      request => of(new Map<string, Position>()).pipe(
        mapWith(
          () => this.subscriptionsDataFeedService.subscribe<any, Position>(request, this.getSubscriptionKey),
          (allPositions, position) => ({ allPositions, position })),
        map(({ allPositions, position }) => {
          if (!this.isEmptyPosition(position) || !!allPositions.get(position.symbol)) {
            allPositions.set(position.symbol, position);
          }

          return Array.from(allPositions.values());
        }),
        startWith([])
      )
    );
  }

  getInstrumentPositionSubscription(portfolioKey: PortfolioKey, instrumentKey: InstrumentKey): Observable<Position | null> {
    return this.getAllPositionsSubscription(portfolioKey.portfolio, portfolioKey.exchange).pipe(
      map(p => p.find(p => p.symbol === instrumentKey.symbol && p.exchange === instrumentKey.exchange)),
      map(p => (!p || !p.avgPrice ? null : p)),
    );
  }

  getOrdersSubscription(portfolio: string, exchange: string): Observable<{ allOrders: Order[], existingOrder?: Order, lastOrder?: Order }> {
    const getOrderWithDates = (o: Order): Order => {
      o.transTime = new Date(o.transTime);
      if (o.endTime) {
        o.endTime = new Date(o.endTime);
      }

      return o;
    };

    return this.getOrCreateSubscription(
      {
        opcode: 'OrdersGetAndSubscribeV2',
        skipHistory: true,
        portfolio,
        exchange
      },
      request => of({
        allOrders: new Map<string, Order>(),
        isHistoryFilled: false
      })
        .pipe(
          mapWith(
            () => combineLatest([
              this.subscriptionsDataFeedService.subscribe<any, Order>(request, this.getSubscriptionKey)
                .pipe(startWith(null)),
              this.getCurrentSessionOrders(portfolio, exchange)
                .pipe(startWith(null))
            ]),
            (state, [subscriptionOrder, ordersHistory] ) => ({
              state,
              subscriptionOrder,
              ordersHistory
            })
          ),
          map(({ state, subscriptionOrder, ordersHistory }) => {
            if (!state.isHistoryFilled && (ordersHistory ?? []).length > 0) {
              ordersHistory!.forEach(o => {
                if (state.allOrders.get(o.id) != null) {
                  return;
                }

                state.allOrders.set(o.id, getOrderWithDates(o));
              });

              state.isHistoryFilled = true;
            }

            let lastOrder: Order | undefined = undefined;
            const existingOrder = state.allOrders.get(subscriptionOrder?.id ?? '');

            if (subscriptionOrder != null) {
              state.allOrders.set(subscriptionOrder.id, getOrderWithDates(subscriptionOrder));
              lastOrder = getOrderWithDates(subscriptionOrder);
            }

            return {
              allOrders: Array.from(state.allOrders.values()) as Order[],
              lastOrder,
              existingOrder
            };
          })
        )
    );
  }

  getStopOrdersSubscription(portfolio: string, exchange: string): Observable<{ allOrders: StopOrder[], existingOrder?: StopOrder, lastOrder?: StopOrder }> {
    const getOrderWithDates = (o: StopOrderResponse): StopOrder => {
      o.transTime = new Date(o.transTime);
      o.endTime = new Date(o.endTime!);

      return {
        ...o,
        transTime: new Date(o.transTime),
        endTime: new Date(o.endTime!),
        triggerPrice: o.stopPrice,
        conditionType: o.condition
      } as StopOrder;
    };

    return this.getOrCreateSubscription(
      {
        skipHistory: true,
        opcode: 'StopOrdersGetAndSubscribeV2',
        portfolio,
        exchange,
      },
      request => of({
        allOrders: new Map<string, StopOrder>(),
        isHistoryFilled: false
      })
        .pipe(
          mapWith(
            () => combineLatest([
              this.subscriptionsDataFeedService.subscribe<any, StopOrderResponse>(request, this.getSubscriptionKey)
                .pipe(startWith(null)),
              this.getCurrentSessionStopOrders(portfolio, exchange)
                .pipe(startWith(null))
            ]),
            (state, [subscriptionOrder, ordersHistory] ) => ({
              state,
              subscriptionOrder,
              ordersHistory
            })
          ),
          map(({ state, subscriptionOrder, ordersHistory }) => {
            if (!state.isHistoryFilled && (ordersHistory ?? []).length > 0) {
              ordersHistory!.forEach(o => {
                if (state.allOrders.get(o.id) != null) {
                  return;
                }

                state.allOrders.set(o.id, getOrderWithDates(o));
              });

              state.isHistoryFilled = true;
            }

            let lastOrder: StopOrder | undefined = undefined;
            const existingOrder = state.allOrders.get(subscriptionOrder?.id ?? '');

            if (subscriptionOrder != null) {
              state.allOrders.set(subscriptionOrder.id, getOrderWithDates(subscriptionOrder));
              lastOrder = getOrderWithDates(subscriptionOrder);
            }

            return {
              allOrders: Array.from(state.allOrders.values()) as StopOrder[],
              lastOrder,
              existingOrder
            };
          })
        )
    );
  }

  private getCurrentSessionOrders(portfolio: string, exchange: string): Observable<Order[] | null> {
    return this.http.get<Order[]>(`${this.baseUrl}/${exchange}/${portfolio}/orders`)
      .pipe(
        catchHttpError<Order[] | null>(null, this.errorHandlerService)
      );
  }

  private getCurrentSessionStopOrders(portfolio: string, exchange: string): Observable<StopOrderResponse[] | null> {
    return this.http.get<StopOrderResponse[]>(`${this.baseUrl}/${exchange}/${portfolio}/stoporders`)
      .pipe(
        catchHttpError<StopOrderResponse[] | null>(null, this.errorHandlerService)
      );
  }

  private getCurrentSessionTrades(portfolio: string, exchange: string): Observable<Trade[] | null> {
    return this.http.get<Trade[]>(`${this.baseUrl}/${exchange}/${portfolio}/trades`)
      .pipe(
        catchHttpError<Trade[] | null>(null, this.errorHandlerService)
      );
  }

  private getSubscriptionKey<T extends PortfolioRequestBase>(request: T): string {
    return `${request.opcode}_${request.portfolio}_${request.exchange}`;
  }

  private getOrCreateSubscription<T extends PortfolioRequestBase, R>(
    request: T,
    createSubscription: (request: T) => Observable<R>): Observable<R> {
    const subscriptionKey = this.getSubscriptionKey(request);

    const existedSubscription$ = this.subscriptions.get(subscriptionKey);
    if (!!existedSubscription$) {
      return existedSubscription$ as Observable<R>;
    }

    const newSubscription$ = createSubscription(request).pipe(
      finalize(() => this.subscriptions.delete(subscriptionKey)),
      shareReplay({ bufferSize: 1, refCount: true })
    );


    this.subscriptions.set(subscriptionKey, newSubscription$);

    return newSubscription$;
  }

  private isEmptyPosition(position: Position): boolean {
    return position.qtyT0 === 0 && position.qtyT1 === 0 && position.qtyT2 === 0 && position.qtyTFuture === 0;
  }
}
