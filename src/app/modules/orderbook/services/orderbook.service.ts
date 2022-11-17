import { Injectable } from '@angular/core';
import {
  combineLatest,
  filter,
  Observable
} from 'rxjs';
import {
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import {
  ChartData,
  ChartPoint,
  OrderBook
} from '../models/orderbook.model';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { Order } from 'src/app/shared/models/orders/order.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { Store } from '@ngrx/store';
import { getSelectedPortfolioKey } from '../../../store/portfolios/portfolios.selectors';
import { Side } from "../../../shared/models/enums/side.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { OrderBookDataFeedHelper } from "../utils/order-book-data-feed.helper";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';

@Injectable()
export class OrderbookService {

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly store: Store,
    private readonly canceller: OrderCancellerService
  ) {
  }

  getOrderBook(settings: OrderbookSettings): Observable<OrderBook> {
    const obData$ = this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
      OrderBookDataFeedHelper.getRealtimeDateRequest(
        settings.symbol,
        settings.exchange,
        settings.instrumentGroup,
        settings.depth
      ),
      OrderBookDataFeedHelper.getOrderbookSubscriptionId
    ).pipe(
      map(ob => this.toOrderBook(ob))
    );


    return combineLatest([obData$, this.getOrders(settings)]).pipe(
      map(([ob, orders]) => {
        const withOrdersRows = ob.rows.map((row) => {
          const askOrders = !!row.ask
            ? OrderBookDataFeedHelper.getCurrentOrdersForItem(row.ask, Side.Sell, orders)
            : [];

          const sumAsk = askOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);
          const askCancels = askOrders.map(
            (o): CancelCommand => ({
              orderid: o.orderId,
              exchange: o.exchange,
              portfolio: o.portfolio,
              stop: false,
            })
          );

          const bidOrders = !!row.bid
            ? OrderBookDataFeedHelper.getCurrentOrdersForItem(row.bid, Side.Buy, orders)
            : [];

          const sumBid = bidOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);

          const bidCancels = bidOrders.map(
            (o): CancelCommand => ({
              orderid: o.orderId,
              exchange: o.exchange,
              portfolio: o.portfolio,
              stop: false,
            })
          );

          row.askOrderVolume = sumAsk;
          row.askCancels = askCancels;
          row.bidOrderVolume = sumBid;
          row.bidCancels = bidCancels;
          return row;
        });
        return { ...ob, rows: withOrdersRows };
      })
    );
  }

  cancelOrder(cancel: CancelCommand) {
    this.canceller.cancelOrder(cancel).subscribe();
  }

  private toOrderBookRows(orderBookData: OrderbookData): OrderBookViewRow[] {
    return orderBookData.a.map((a, i) => {
      const obr: OrderBookViewRow = {
        ask: a.p,
        askVolume: a.v,
        yieldAsk: a.y,
        yieldBid: orderBookData.b[i]?.y ?? 0,
        bid: orderBookData.b[i]?.p ?? 0,
        bidVolume: orderBookData.b[i]?.v ?? 0,
      };

      return obr;
    });
  }

  private toOrderBook(orderBookData: OrderbookData): OrderBook {
    const rows = this.toOrderBookRows(orderBookData);
    const volumes = [
      ...rows.map((p) => p?.askVolume ?? 0),
      ...rows.map((p) => p?.bidVolume ?? 0),
    ];

    return {
      maxVolume: Math.max(...volumes),
      rows: rows,
      chartData: this.makeChartData(rows),
      bidVolumes: rows.map(r => r.bidVolume).reduce((curr, prev) => curr! + prev!, 0),
      askVolumes: rows.map(r => r.askVolume).reduce((curr, prev) => curr! + prev!, 0),
    } as OrderBook;
  }

  private makeChartData(rows: OrderBookViewRow[]): ChartData {
    const asks = new Array<ChartPoint>(rows.length);
    const bids = new Array<ChartPoint>(rows.length);
    let j = 0;
    for (let k = rows.length - 1; k >= 0; k--) {
      const row = rows[k];
      j++;
      for (let i = 0; i < j; i++) {
        asks[i] = {
          y: (asks[i]?.y ?? 0) + (row?.askVolume ?? 0),
          x: asks[i]?.x ?? row?.ask ?? 0,
        };
        bids[i] = {
          y: (bids[i]?.y ?? 0) + (row?.bidVolume ?? 0),
          x: bids[i]?.x ?? row?.bid ?? 0,
        };
      }
    }
    const minPrice = Math.min(...bids.map(b => b.x));
    const maxPrice = Math.max(...asks.map(a => a.x));
    return {
      asks: asks,
      bids: bids,
      minPrice: minPrice,
      maxPrice: maxPrice
    };
  }

  private getOrders(instrument: InstrumentKey): Observable<Order[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange)),
      map(x => x.allOrders.filter(o => o.symbol === instrument.symbol)),
      startWith([])
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.store.select(getSelectedPortfolioKey)
      .pipe(
        filter((p): p is PortfolioKey => !!p)
      );
  }
}
