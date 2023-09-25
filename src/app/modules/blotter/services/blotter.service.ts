import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  interval,
  Observable,
  switchMap,
  tap,
} from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import {
  CurrencyCode,
} from 'src/app/shared/models/enums/currencies.model';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { BlotterSettings } from '../models/blotter-settings.model';
import {Position} from "../../../shared/models/positions/position.model";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  RepoTrade,
  Trade
} from "../../../shared/models/trades/trade.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";

@Injectable()
export class BlotterService {

  private shouldShowOrderGroupModal = new BehaviorSubject<boolean>(false);
  private orderGroupParams = new BehaviorSubject<string | null>(null);
  shouldShowOrderGroupModal$ = this.shouldShowOrderGroupModal.asObservable();
  orderGroupParams$ = this.orderGroupParams.asObservable();

  constructor(
    private readonly notification: OrdersNotificationsService,
    private readonly dashboardContextService: DashboardContextService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly http: HttpClient,
    private readonly errorHandler: ErrorHandlerService
  ) {
  }

  selectNewInstrument(symbol: string, exchange: string, badgeColor: string) {
    if (symbol == CurrencyCode.RUB) {
      return;
    }
    if (CurrencyCode.isCurrency(symbol)) {
      symbol = CurrencyCode.toInstrument(symbol);
      exchange = Exchanges.MOEX;
    }
    const instrument = { symbol, exchange, instrumentGroup: undefined };
    this.dashboardContextService.selectDashboardInstrument(instrument, badgeColor);
  }

  getPositions(settings: BlotterSettings): Observable<Position[]> {
    return this.portfolioSubscriptionsService.getAllPositionsSubscription(settings.portfolio, settings.exchange).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses),
    );
  }

  getTrades(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getTradesSubscription(settings.portfolio, settings.exchange);
  }

  getTradesHistory(settings: BlotterSettings, options?: Partial<{from: string | null, limit: number | null}>): Observable<Trade[] | null> {
    let params: any = {
      descending: true
    };

    if(options) {
      if(options.limit != null) {
        params.limit = options.limit;
      }

      if(options.from) {
        params.from = options.from;
      }
    }
    return this.http.get<Trade[]>(
      `${environment.apiUrl}/md/stats/${settings.exchange}/${settings.portfolio}/history/trades`,
      {
        params
      }
    ).pipe(
      catchHttpError<Trade[] | null>(null, this.errorHandler),
      map(trades => {
        if (!trades) {
          return trades;
        }

        return trades.map(t => ({
          ...t,
          date: new Date(t.date)
        }));
      })
    );
  }

  getRepoTrades(settings: BlotterSettings): Observable<RepoTrade[]> {
    return interval(10_000)
      .pipe(
        startWith(0),
        switchMap(() => this.http.get<RepoTrade[]>(`${environment.apiUrl}/md/v2/Clients/${settings.exchange}/${settings.portfolio}/trades`, {
          params: {
            withRepo: true
          }
        })),
        map(trades => trades.filter(t => !!t.repoSpecificFields)),
        catchHttpError<RepoTrade[]>([], this.errorHandler)
      );
  }

  getOrders(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  getStopOrders(settings: BlotterSettings) {
    return this.portfolioSubscriptionsService.getStopOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        }
        else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  openOrderGroupModal(groupId: string) {
    this.orderGroupParams.next(groupId);
    this.shouldShowOrderGroupModal.next(true);
  }

  closeOrderGroupModal() {
    this.orderGroupParams.next(null);
    this.shouldShowOrderGroupModal.next(false);
  }
}
