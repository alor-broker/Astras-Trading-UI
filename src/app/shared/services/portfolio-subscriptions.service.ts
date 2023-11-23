import { Injectable } from '@angular/core';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {
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
import { mapWith } from '../utils/observable-helper';
import { Position } from '../models/positions/position.model';
import {Order, StopOrder, StopOrderResponse} from '../models/orders/order.model';
import {PortfolioKey} from "../models/portfolio-key.model";
import {InstrumentKey} from "../models/instruments/instrument-key.model";

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

  constructor(private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService) {
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
    return this.getOrCreateSubscription(
      {
        opcode: 'TradesGetAndSubscribeV2',
        portfolio,
        exchange
      },
      request => of(new Map<string, Trade>()).pipe(
        mapWith(
          () => this.subscriptionsDataFeedService.subscribe<any, Trade>(request, this.getSubscriptionKey),
          (allTrades, trade) => ({ allTrades, trade })),
        map(({ allTrades, trade }) => {
          allTrades.set(trade.id, {
            ...trade,
            date: new Date(trade.date)
          });
          return Array.from(allTrades.values());
        }),
        startWith([])
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
    return this.getOrCreateSubscription(
      {
        opcode: 'OrdersGetAndSubscribeV2',
        portfolio,
        exchange
      },
      request => of(new Map<string, Order>()).pipe(
        mapWith(
          () => this.subscriptionsDataFeedService.subscribe<any, Order>(request, this.getSubscriptionKey),
          (allOrders, order) => ({ allOrders, order })),
        map(({ allOrders, order }) => {
          order.transTime = new Date(order.transTime);
          order.endTime = new Date(order.endTime);

          const lastOrder = order;
          const existingOrder = allOrders.get(order.id);

          allOrders.set(order.id, lastOrder);

          return {
            allOrders: Array.from(allOrders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id)),
            existingOrder,
            lastOrder
          };
        }),
        startWith(({
            allOrders: [],
          }
        ))
      )
    );
  }

  getStopOrdersSubscription(portfolio: string, exchange: string): Observable<{ allOrders: StopOrder[], existingOrder?: StopOrder, lastOrder?: StopOrder }> {
    return this.getOrCreateSubscription(
      {
        opcode: 'StopOrdersGetAndSubscribeV2',
        portfolio,
        exchange
      },
      request => of(new Map<string, StopOrder>()).pipe(
        mapWith(
          () => this.subscriptionsDataFeedService.subscribe<any, StopOrderResponse>(request, this.getSubscriptionKey),
          (allOrders, order) => ({ allOrders, order })),
        map(({ allOrders, order }) => {
          order.transTime = new Date(order.transTime);
          order.endTime = new Date(order.endTime);

          const lastOrder = {
            ...order,
            triggerPrice: order.stopPrice,
            conditionType: order.condition
          };

          const existingOrder = allOrders.get(order.id);

          allOrders.set(order.id, lastOrder);

          return {
            allOrders: Array.from(allOrders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id)),
            existingOrder,
            lastOrder
          };
        }),
        startWith(({
            allOrders: [],
          }
        ))
      )
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
