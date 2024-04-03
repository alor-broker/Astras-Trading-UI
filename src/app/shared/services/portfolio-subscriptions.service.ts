import { Injectable } from '@angular/core';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {
  Observable,
  of,
  shareReplay,
  switchMap
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
    return this.getTradesHistory(portfolio, exchange)
      .pipe(
        map(trades => new Map((trades ?? []).map(t => ([
              t.id,
              {
                ...t, date: new Date(t.date)
              }
            ]))
          )
        ),
        switchMap(tradesMap => this.getOrCreateSubscription(
          {
            opcode: 'TradesGetAndSubscribeV2',
            skipHistory: true,
            portfolio,
            exchange
          },
          request => this.subscriptionsDataFeedService.subscribe<any, Trade>(request, this.getSubscriptionKey)
            .pipe(
              map(trade => {
                tradesMap.set(trade.id, {
                  ...trade,
                  date: new Date(trade.date)
                });
                return Array.from(tradesMap.values());
              }),
              startWith(Array.from(tradesMap.values()))
            )
        ))
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
    return this.getOrdersHistory(portfolio, exchange)
      .pipe(
        map(orders => {
          return new Map<string, Order>((orders ?? []).map(o => {
            const order = JSON.parse(JSON.stringify(o)) as Order;

            if (order.endTime) {
              order.endTime = new Date(order.endTime);
            }

            return [order.id, order];
          }));
        }),
        switchMap(ordersMap => this.getOrCreateSubscription(
          {
            opcode: 'OrdersGetAndSubscribeV2',
            skipHistory: true,
            portfolio,
            exchange
          },
          request => this.subscriptionsDataFeedService.subscribe<any, Order>(request, this.getSubscriptionKey)
            .pipe(
              map(order => {
                order.transTime = new Date(order.transTime);
                if (order.endTime) {
                  order.endTime = new Date(order.endTime);
                }

                const lastOrder = order;
                const existingOrder = ordersMap.get(order.id);

                ordersMap.set(order.id, lastOrder);

                return {
                  allOrders: Array.from(ordersMap.values()).sort((o1, o2) => o2.id.localeCompare(o1.id)),
                  existingOrder,
                  lastOrder
                };
              }),
              startWith(({
                  allOrders: Array.from(ordersMap.values()).sort((o1, o2) => o2.id.localeCompare(o1.id)),
                }
              ))
            )
        ))
      );
  }

  getStopOrdersSubscription(portfolio: string, exchange: string): Observable<{ allOrders: StopOrder[], existingOrder?: StopOrder, lastOrder?: StopOrder }> {
    return this.getStopOrdersHistory(portfolio, exchange)
      .pipe(
        map(orders => {
          return new Map<string, StopOrder>((orders ?? []).map(o => {
            const order = JSON.parse(JSON.stringify(o)) as StopOrderResponse;

            order.transTime = new Date(order.transTime);
            order.endTime = new Date(order.endTime!);

            return [order.id, { ...order, triggerPrice: order.stopPrice, conditionType: order.condition}];
          }));
        }),
        switchMap(ordersMap => this.getOrCreateSubscription(
          {
            skipHistory: true,
            opcode: 'StopOrdersGetAndSubscribeV2',
            portfolio,
            exchange,
          },
          request => this.subscriptionsDataFeedService.subscribe<any, StopOrderResponse>(request, this.getSubscriptionKey)
            .pipe(
              map(order => {
                order.transTime = new Date(order.transTime);
                order.endTime = new Date(order.endTime!);

                const lastOrder = {
                  ...order,
                  triggerPrice: order.stopPrice,
                  conditionType: order.condition
                };

                const existingOrder = ordersMap.get(order.id);

                ordersMap.set(order.id, lastOrder);

                return {
                  allOrders: Array.from(ordersMap.values()).sort((o1, o2) => o2.id.localeCompare(o1.id)),
                  existingOrder,
                  lastOrder
                };
              }),
              startWith(({
                  allOrders: Array.from(ordersMap.values()).sort((o1, o2) => o2.id.localeCompare(o1.id)),
                }
              ))
            )
        ))
      );
  }

  private getOrdersHistory(portfolio: string, exchange: string): Observable<Order[] | null> {
    return this.http.get<Order[]>(`${this.baseUrl}/${exchange}/${portfolio}/orders`)
      .pipe(
        catchHttpError<Order[] | null>(null, this.errorHandlerService)
      );
  }

  private getStopOrdersHistory(portfolio: string, exchange: string): Observable<StopOrderResponse[] | null> {
    return this.http.get<StopOrderResponse[]>(`${this.baseUrl}/${exchange}/${portfolio}/stoporders`)
      .pipe(
        catchHttpError<StopOrderResponse[] | null>(null, this.errorHandlerService)
      );
  }

  private getTradesHistory(portfolio: string, exchange: string): Observable<Trade[] | null> {
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
