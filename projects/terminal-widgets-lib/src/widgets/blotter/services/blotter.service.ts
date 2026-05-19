import {
  inject,
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
import {
  map,
  startWith
} from 'rxjs/operators';
import {OrdersNotificationsService} from '@terminal-widgets-lib/widgets/blotter/services/order-notifications.service';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {ACTIONS_CONTEXT} from '@terminal-core-lib/features/dashboard/types/dashboard-actions-context.types';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {BlotterWidgetSettings} from '@terminal-widgets-lib/widgets/blotter/widget-settings.types';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {
  RepoSpecificFields,
  RepoTrade,
  RepoTradeResponse,
  Trade
} from '@terminal-core-lib/features/portfolios/types/trade.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {PortfolioItemsModelHelper} from '@terminal-core-lib/features/portfolios/utils/portfolio-items-model.helper';
import {
  Order,
  StopOrder
} from '@terminal-core-lib/features/portfolios/types/order.types';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';

@Injectable()
export class BlotterService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly notification = inject(OrdersNotificationsService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandler = inject(ErrorHandlerService);

  private readonly marketService = inject(MarketService);

  private readonly actionsContext = inject(ACTIONS_CONTEXT);

  private readonly shouldShowOrderGroupModal = new BehaviorSubject<boolean>(false);

  private readonly orderGroupParams = new BehaviorSubject<string | null>(null);

  selectNewInstrument(symbol: string, exchange: string, board: string | null, badgeColor: string): void {
    this.getInstrumentToSelect(symbol, exchange, board)
      .subscribe(instrument => {
        if (instrument == null) {
          return;
        }

        this.actionsContext.selectInstrument(instrument, badgeColor);
      });
  }

  getInstrumentToSelect(symbol: string, exchange: string, board: string | null): Observable<InstrumentKey | null> {
    return this.marketService.getMarketSettings().pipe(
      take(1),
      map(marketSettings => {
        if (symbol === marketSettings.currencies.baseCurrency) {
          return null;
        }

        const mappedCurrency = marketSettings.currencies.portfolioCurrencies.find(c => c.positionSymbol === symbol);
        if (mappedCurrency != null) {
          if (mappedCurrency.exchangeInstrument == null) {
            return null;
          }

          return {
            symbol: mappedCurrency.exchangeInstrument.symbol,
            exchange: mappedCurrency.exchangeInstrument.exchange ?? marketSettings.currencies.defaultCurrencyExchange
          };
        }

        return {symbol, exchange, instrumentGroup: board};
      })
    );
  }

  getPositions(settings: BlotterWidgetSettings): Observable<Position[]> {
    return this.portfolioSubscriptionsService.getAllPositionsSubscription(settings.portfolio, settings.exchange).pipe(
      map(poses => settings.isSoldPositionsHidden ? poses.filter(p => p.qtyTFuture !== 0) : poses),
    );
  }

  getTrades(settings: BlotterWidgetSettings): Observable<Trade[]> {
    return this.portfolioSubscriptionsService.getTradesSubscription(settings.portfolio, settings.exchange);
  }

  getRepoTrades(settings: BlotterWidgetSettings): Observable<RepoTrade[]> {
    const ownedPortfolio: PortfolioKey = {
      portfolio: settings.portfolio,
      exchange: settings.exchange
    };

    return interval(10_000)
      .pipe(
        startWith(0),
        switchMap(() => this.httpClient.get<RepoTradeResponse[]>(`${this.coreApiUrlProvider.apiUrl}/md/v2/Clients/${ownedPortfolio.exchange}/${ownedPortfolio.portfolio}/trades`, {
          params: {
            withRepo: true,
            format: 'heavy'
          }
        })),
        map(trades => trades.filter(t => !!(t.repoSpecificFields as RepoSpecificFields | undefined))),
        catchHttpError<RepoTradeResponse[]>([], this.errorHandler),
        map(trades => {
          return trades.map(i => PortfolioItemsModelHelper.repoTradeResponseToModel(i, ownedPortfolio));
        })
      );
  }

  getOrders(settings: BlotterWidgetSettings): Observable<Order[]> {
    return this.portfolioSubscriptionsService.getOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        } else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }

  getStopOrders(settings: BlotterWidgetSettings): Observable<StopOrder[]> {
    return this.portfolioSubscriptionsService.getStopOrdersSubscription(settings.portfolio, settings.exchange).pipe(
      tap(x => {
        if (!x.lastOrder) {
          return;
        }

        if (x.existingOrder) {
          this.notification.notificateOrderChange(x.lastOrder, x.existingOrder);
        } else {
          this.notification.notificateAboutNewOrder(x.lastOrder);
        }
      }),
      map(x => x.allOrders)
    );
  }
}
