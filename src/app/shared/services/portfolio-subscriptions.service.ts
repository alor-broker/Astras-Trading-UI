import { Injectable, inject } from '@angular/core';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {
  combineLatest,
  Observable,
  of,
  shareReplay
} from 'rxjs';
import { CommonSummaryModel } from '../../modules/blotter/models/common-summary.model';
import { ForwardRisks } from '../../modules/blotter/models/forward-risks.model';
import {Trade, TradeResponse} from '../models/trades/trade.model';
import {
  finalize,
  map,
  startWith
} from 'rxjs/operators';
import { catchHttpError, mapWith } from '../utils/observable-helper';
import {Position, PositionResponse} from '../models/positions/position.model';
import {Order, OrderResponse, StopOrder, StopOrderResponse} from '../models/orders/order.model';
import {PortfolioKey} from "../models/portfolio-key.model";
import {InstrumentKey} from "../models/instruments/instrument-key.model";
import { HttpClient } from "@angular/common/http";
import { EnvironmentService } from "./environment.service";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import {PortfolioItemsModelHelper} from "../utils/portfolio-item-models-helper";
import { Risks } from "../../modules/blotter/models/risks.model";

interface PortfolioRequestBase {
  opcode: string;
  portfolio: string;
  exchange: string;
}

@Injectable({
  providedIn: 'root'
})
export class PortfolioSubscriptionsService {
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly subscriptions = new Map<string, Observable<any>>();
  private readonly baseUrl = this.environmentService.apiUrl + '/md/v2/Clients';

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

  getRisksSubscription(portfolio: string, exchange: string): Observable<Risks> {
    return this.subscriptionsDataFeedService.subscribe({
        opcode: 'RisksGetAndSubscribe',
        portfolio,
        exchange
      },
      this.getSubscriptionKey
    );
  }

  getTradesSubscription(portfolio: string, exchange: string): Observable<Trade[]> {
    const ownedPortfolio: PortfolioKey = { portfolio, exchange };
    return this.getOrCreateSubscription(
      {
        opcode: 'TradesGetAndSubscribeV2',
        skipHistory: true,
        portfolio,
        exchange,
        format: 'heavy'
      },
      request => of({
        allTrades: new Map<string, Trade>(),
        isHistoryFilled: false
      })
        .pipe(
          mapWith(
            () => combineLatest({
              tradeUpdates: this.subscriptionsDataFeedService.subscribe<PortfolioRequestBase, TradeResponse>(request, this.getSubscriptionKey)
                .pipe(
                  map(t => PortfolioItemsModelHelper.tradeResponseToModel(t, ownedPortfolio)),
                  startWith(null)
                ),
              sessionTrades: this.getCurrentSessionTrades(portfolio, exchange)
                .pipe(
                  startWith(null)
                )
            }),
            (state, output) => ({
              state,
              ...output
            })
          ),
          map(({ state, tradeUpdates, sessionTrades }) => {
            if (!state.isHistoryFilled && (sessionTrades ?? []).length > 0) {
              sessionTrades!.forEach(t => {
                if (state.allTrades.get(t.id) != null) {
                  return;
                }

                state.allTrades.set(t.id, t);
              });

              state.isHistoryFilled = true;
            }

            if (tradeUpdates != null) {
              state.allTrades.set(tradeUpdates.id, tradeUpdates);
            }

            return Array.from(state.allTrades.values());
          })
        )
    );
  }

  getAllPositionsSubscription(portfolio: string, exchange: string): Observable<Position[]> {
    const ownedPortfolio: PortfolioKey = {portfolio, exchange};

    return this.getOrCreateSubscription(
      {
        opcode: 'PositionsGetAndSubscribeV2',
        portfolio,
        exchange
      },
      request => of(new Map<string, Position>()).pipe(
        mapWith(
          () => this.subscriptionsDataFeedService.subscribe<PortfolioRequestBase, PositionResponse>(request, this.getSubscriptionKey),
          (allPositions, positionResponse) => ({ allPositions, positionResponse })),
        map(({ allPositions, positionResponse }) => {
          const position = PortfolioItemsModelHelper.positionResponseToModel(positionResponse, ownedPortfolio);
          if (!this.isEmptyPosition(position) || !!allPositions.get(position.targetInstrument.symbol)) {
            allPositions.set(position.targetInstrument.symbol, position);
          }

          return Array.from(allPositions.values());
        }),
        startWith([])
      )
    );
  }

  getInstrumentPositionSubscription(portfolioKey: PortfolioKey, instrumentKey: InstrumentKey): Observable<Position | null> {
    return this.getAllPositionsSubscription(portfolioKey.portfolio, portfolioKey.exchange).pipe(
      map(p => p.find(p => p.targetInstrument.symbol === instrumentKey.symbol && p.targetInstrument.exchange === instrumentKey.exchange)),
      map(p => (!p || !p.avgPrice ? null : p)),
    );
  }

  getOrdersSubscription(portfolio: string, exchange: string): Observable<{ allOrders: Order[], existingOrder?: Order, lastOrder?: Order }> {
    const ownedPortfolio: PortfolioKey = { portfolio, exchange };

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
            () => combineLatest({
              orderUpdates: this.subscriptionsDataFeedService.subscribe<PortfolioRequestBase, OrderResponse>(request, this.getSubscriptionKey)
                .pipe(
                  map(o => PortfolioItemsModelHelper.orderResponseToModel(o, ownedPortfolio)),
                  startWith(null)
                ),
              sessionOrders: this.getCurrentSessionOrders(portfolio, exchange)
                .pipe(
                  startWith(null)
                )
            }),
            (state, output) => ({
              state,
              ...output
            })
          ),
          map(({ state, orderUpdates, sessionOrders }) => {
            if (!state.isHistoryFilled && (sessionOrders ?? []).length > 0) {
              sessionOrders!.forEach(o => {
                if (state.allOrders.get(o.id) != null) {
                  return;
                }

                state.allOrders.set(o.id, o);
              });

              state.isHistoryFilled = true;
            }

            let lastOrder: Order | undefined = undefined;
            const existingOrder = state.allOrders.get(orderUpdates?.id ?? '');

            if (orderUpdates != null) {
              state.allOrders.set(orderUpdates.id, orderUpdates);
              lastOrder = orderUpdates;
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
    const ownedPortfolio: PortfolioKey = { portfolio, exchange };

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
            () => combineLatest({
              orderUpdates: this.subscriptionsDataFeedService.subscribe<PortfolioRequestBase, StopOrderResponse>(request, this.getSubscriptionKey)
                .pipe(
                  map(o => PortfolioItemsModelHelper.stopOrderResponseToModel(o, ownedPortfolio)),
                  startWith(null)
                ),
              sessionOrders: this.getCurrentSessionStopOrders(portfolio, exchange)
                .pipe(
                  startWith(null)
                )
            }),
            (state, output) => ({
              state,
              ...output
            })
          ),
          map(({ state, orderUpdates, sessionOrders }) => {
            if (!state.isHistoryFilled && (sessionOrders ?? []).length > 0) {
              sessionOrders!.forEach(o => {
                if (state.allOrders.get(o.id) != null) {
                  return;
                }

                state.allOrders.set(o.id, o);
              });

              state.isHistoryFilled = true;
            }

            let lastOrder: StopOrder | undefined = undefined;
            const existingOrder = state.allOrders.get(orderUpdates?.id ?? '');

            if (orderUpdates != null) {
              state.allOrders.set(orderUpdates.id, orderUpdates);
              lastOrder = orderUpdates;
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
    return this.http.get<OrderResponse[]>(`${this.baseUrl}/${exchange}/${portfolio}/orders`)
      .pipe(
        catchHttpError<OrderResponse[] | null>(null, this.errorHandlerService),
        map(r => {
          if(r == null) {
            return null;
          }

          return r.map(i => PortfolioItemsModelHelper.orderResponseToModel(i, {portfolio, exchange}));
        })
      );
  }

  private getCurrentSessionStopOrders(portfolio: string, exchange: string): Observable<StopOrder[] | null> {
    return this.http.get<StopOrderResponse[]>(`${this.baseUrl}/${exchange}/${portfolio}/stoporders`)
      .pipe(
        catchHttpError<StopOrderResponse[] | null>(null, this.errorHandlerService),
        map(r => {
          if(r == null) {
            return null;
          }

          return r.map(i => PortfolioItemsModelHelper.stopOrderResponseToModel(i, {portfolio, exchange}));
        })
      );
  }

  private getCurrentSessionTrades(portfolio: string, exchange: string): Observable<Trade[] | null> {
    return this.http.get<TradeResponse[]>(`${this.baseUrl}/${exchange}/${portfolio}/trades`, {
      params: {
        format: 'heavy'
      }
    })
      .pipe(
        catchHttpError<TradeResponse[] | null>(null, this.errorHandlerService),
        map(r => {
          if(r == null) {
            return null;
          }

          return r.map(i => PortfolioItemsModelHelper.tradeResponseToModel(i, {portfolio, exchange}));
        })
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
