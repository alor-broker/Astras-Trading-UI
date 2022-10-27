import { Injectable } from '@angular/core';
import { BaseWebsocketService } from "../../../shared/services/base-websocket.service";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { Store } from "@ngrx/store";
import {
  filter,
  Observable,
  of
} from "rxjs";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { getSelectedPortfolioKey } from "../../../store/portfolios/portfolios.selectors";
import { ScalperOrderBookSettings } from "../../../shared/models/settings/scalper-order-book-settings.model";
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

@Injectable()
export class ScalperOrderBookService extends BaseWebsocketService {
  private readonly currentOrders: Map<string, Order> = new Map<string, Order>();

  constructor(
    ws: WebsocketService,
    private readonly store: Store,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
    super(ws);
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
    return this.getEntity<OrderbookData>(OrderBookDataFeedHelper.getRealtimeDateRequest(
      settings.guid,
      settings.symbol,
      settings.exchange,
      settings.instrumentGroup,
      settings.depth));
  }

  public getCurrentOrders(instrument: InstrumentKey, trackId: string): Observable<Order[]> {
    this.currentOrders.clear();
    return this.getCurrentPortfolio().pipe(
      switchMap((p) => {
        if (p) {
          return this.getPortfolioEntity<Order>(
            p.portfolio,
            p.exchange,
            'OrdersGetAndSubscribeV2',
            trackId
          ).pipe(
            filter(order => order.symbol === instrument.symbol),
            map((order: Order) => {
              this.currentOrders.set(order.id, order);
              return Array.from(this.currentOrders.values()).sort((o1, o2) =>
                o2.id.localeCompare(o1.id)
              );
            }),
            map(orders => orders.filter(x => x.status === 'working'))
          );
        }

        return of([]);
      }),
      startWith([])
    );
  }

  public getOrderBookPosition(instrumentKey: InstrumentKey, trackId: string): Observable<Position | null> {
    return this.getCurrentPortfolio().pipe(
      switchMap(portfolio => this.getPortfolioEntity<Position>(portfolio.portfolio, instrumentKey.exchange,
        'PositionsGetAndSubscribeV2',
        trackId
      )),
      filter((p): p is Position => !!p),
      filter(p => p.symbol === instrumentKey.symbol),
      map(p => (!p || !p.avgPrice ? null as any : p)),
      startWith(null)
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.store.select(getSelectedPortfolioKey)
      .pipe(
        filter((p): p is PortfolioKey => !!p)
      );
  }
}
