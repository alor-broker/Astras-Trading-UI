import {
  Inject,
  Injectable
} from '@angular/core';
import {
  BehaviorSubject,
  interval,
  Observable,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { BlotterSettings } from '../models/blotter-settings.model';
import {Position} from "../../../shared/models/positions/position.model";
import { HttpClient } from "@angular/common/http";
import { RepoSpecificFields, RepoTrade, Trade } from "../../../shared/models/trades/trade.model";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { Order, StopOrder } from "../../../shared/models/orders/order.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { MarketService } from "../../../shared/services/market.service";
import {
  ACTIONS_CONTEXT,
  ActionsContext
} from "../../../shared/services/actions-context";

@Injectable()
export class BlotterService {

  private readonly shouldShowOrderGroupModal = new BehaviorSubject<boolean>(false);
  private readonly orderGroupParams = new BehaviorSubject<string | null>(null);
  shouldShowOrderGroupModal$ = this.shouldShowOrderGroupModal.asObservable();
  orderGroupParams$ = this.orderGroupParams.asObservable();

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly notification: OrdersNotificationsService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly http: HttpClient,
    private readonly errorHandler: ErrorHandlerService,
    private readonly marketService: MarketService,
    @Inject(ACTIONS_CONTEXT)
    private readonly actionsContext: ActionsContext
  ) {
  }

  selectNewInstrument(symbol: string, exchange: string, board: string | null, badgeColor: string): void {
    this.marketService.getMarketSettings().pipe(
      take(1)
    ).subscribe(marketSettings => {
      if(symbol === marketSettings.currencies.baseCurrency) {
        return;
      }

      const mappedCurrency = marketSettings.currencies.portfolioCurrencies.find(c => c.positionSymbol === symbol);
      if(mappedCurrency != null) {
        if (mappedCurrency.exchangeInstrument == null) {
          return;
        }

        this.actionsContext.instrumentSelected(
          {
            symbol: mappedCurrency.exchangeInstrument.symbol,
            exchange: mappedCurrency.exchangeInstrument.exchange ?? marketSettings.currencies.defaultCurrencyExchange
          },
          badgeColor
        );

        return;
      }

      const instrument: InstrumentKey = { symbol, exchange, instrumentGroup: board };

      this.actionsContext.instrumentSelected(instrument, badgeColor);
    });
  }

  getPositions(settings: BlotterSettings): Observable<Position[]> {
    return this.portfolioSubscriptionsService.getAllPositionsSubscription(settings.portfolio, settings.exchange).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses),
    );
  }

  getTrades(settings: BlotterSettings): Observable<Trade[]> {
    return this.portfolioSubscriptionsService.getTradesSubscription(settings.portfolio, settings.exchange);
  }

  getRepoTrades(settings: BlotterSettings): Observable<RepoTrade[]> {
    return interval(10_000)
      .pipe(
        startWith(0),
        switchMap(() => this.http.get<RepoTrade[]>(`${this.environmentService.apiUrl}/md/v2/Clients/${settings.exchange}/${settings.portfolio}/trades`, {
          params: {
            withRepo: true,
            format: 'heavy'
          }
        })),
        map(trades => trades.filter(t => !!(t.repoSpecificFields as RepoSpecificFields | undefined))),
        catchHttpError<RepoTrade[]>([], this.errorHandler)
      );
  }

  getOrders(settings: BlotterSettings): Observable<Order[]> {
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

  getStopOrders(settings: BlotterSettings): Observable<StopOrder[]> {
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

  openOrderGroupModal(groupId: string): void {
    this.orderGroupParams.next(groupId);
    this.shouldShowOrderGroupModal.next(true);
  }

  closeOrderGroupModal(): void {
    this.orderGroupParams.next(null);
    this.shouldShowOrderGroupModal.next(false);
  }
}
