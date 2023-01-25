import { Injectable } from '@angular/core';
import { Observable } from "rxjs";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import {
  map,
  startWith,
  switchMap
} from "rxjs/operators";
import { OrderbookData } from "../models/orderbook-data.model";
import { OrderBookDataFeedHelper } from "../utils/order-book-data-feed.helper";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { Order } from "../../../shared/models/orders/order.model";
import { HttpClient } from '@angular/common/http';
import { Quote } from 'src/app/shared/models/quotes/quote.model';
import { environment } from '../../../../environments/environment';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { Position } from '../../../shared/models/positions/position.model';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { ScalperOrderBookSettings } from '../models/scalper-order-book-settings.model';

@Injectable()
export class ScalperOrderBookService {
  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly currentDashboardService: DashboardContextService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getLastPrice(instrumentKey: InstrumentKey): Observable<number | null> {
    return this.httpClient.get<Quote[]>(`${environment.apiUrl}/md/v2/Securities/${instrumentKey.exchange}:${instrumentKey.symbol}/quotes`).pipe(
      catchHttpError<Quote[]>([], this.errorHandlerService),
      map(quotes => {
        if (quotes.length >= 1) {
          return quotes[0].last_price;
        }

        return null;
      })
    );
  }

  getOrderBook(settings: ScalperOrderBookSettings): Observable<OrderbookData> {
    return this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
      OrderBookDataFeedHelper.getRealtimeDateRequest(
        settings.symbol,
        settings.exchange,
        settings.instrumentGroup,
        settings.depth
      ),
      OrderBookDataFeedHelper.getOrderbookSubscriptionId
    );
  }

  public getCurrentOrders(instrument: InstrumentKey): Observable<Order[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange)),
      map(x => x.allOrders.filter(o => o.symbol === instrument.symbol && o.exchange === instrument.exchange && o.status === 'working'))
    );
  }

  public getOrderBookPosition(instrumentKey: InstrumentKey): Observable<Position | null> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.portfolioSubscriptionsService.getAllPositionsSubscription(p.portfolio, p.exchange)),
      map(x => x.find(p => p.symbol === instrumentKey.symbol && p.exchange === instrumentKey.exchange)),
      map(p => (!p || !p.avgPrice ? null as any : p)),
      startWith(null)
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }
}
