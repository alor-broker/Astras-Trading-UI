import { Injectable } from '@angular/core';
import {
  combineLatest,
  Observable
} from 'rxjs';
import {
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import {
  OrderbookData,
  OrderbookRequest
} from '../models/orderbook-data.model';
import {
  CurrentOrder,
  OrderBookViewRow
} from '../models/orderbook-view-row.model';
import {
  ChartData,
  ChartPoint,
  OrderBook
} from '../models/orderbook.model';
import { Order } from 'src/app/shared/models/orders/order.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { OrderBookDataFeedHelper } from "../utils/order-book-data-feed.helper";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { OrderbookSettings } from '../models/orderbook-settings.model';

@Injectable()
export class OrderbookService {

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly portfolioSubscriptionsService: PortfolioSubscriptionsService,
    private readonly currentDashboardService: DashboardContextService,
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
          const askOrders = row.ask != null
            ? OrderBookDataFeedHelper.getCurrentOrdersForItem(row.ask, orders)
            : [];

          const sumAsk = askOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);

          const bidOrders = row.bid != null
            ? OrderBookDataFeedHelper.getCurrentOrdersForItem(row.bid, orders)
            : [];

          const sumBid = bidOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);

          row.askOrderVolume = sumAsk;
          row.askOrders = askOrders;
          row.bidOrderVolume = sumBid;
          row.bidOrders = bidOrders;
          return row;
        });
        return { ...ob, rows: withOrdersRows };
      })
    );
  }

  cancelOrder(order: CurrentOrder) {
    this.canceller.cancelOrder({
      exchange: order.exchange,
      portfolio: order.portfolio,
      orderid: order.orderId,
      stop: false
    }).subscribe();
  }

  private toOrderBookRows(orderBookData: OrderbookData): OrderBookViewRow[] {
    const rows: OrderBookViewRow[] = [];

    if (orderBookData.a.length === 0 && orderBookData.b.length === 0) {
      return [];
    }

    for (let i = 0; i < Math.max(orderBookData.a.length, orderBookData.b.length); i++) {
      const row: OrderBookViewRow = {
        ask: orderBookData.a[i]?.p,
        askVolume: orderBookData.a[i]?.v ?? 0,
        yieldAsk: orderBookData.a[i]?.y ?? 0,
        bid: orderBookData.b[i]?.p,
        bidVolume: orderBookData.b[i]?.v ?? 0,
        yieldBid: orderBookData.b[i]?.y ?? 0,
        askOrders: [],
        bidOrders: []
      };

      rows.push(row);
    }

    return rows;
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

    let minPrice = Math.min(...bids.map(b => b.x).filter(x => x > 0));
    let maxPrice = Math.max(...asks.map(a => a.x).filter(x => x > 0));

    if (minPrice === Infinity) {
      minPrice = maxPrice === -Infinity ? maxPrice : Math.min(...asks.map(a => a.x).filter(x => x > 0));
      minPrice -= maxPrice === minPrice ? minPrice : maxPrice - minPrice;
    }

    if (maxPrice === -Infinity) {
      maxPrice = minPrice === Infinity ? minPrice : Math.max(...bids.map(b => b.x).filter(x => x > 0));
      maxPrice += maxPrice === minPrice ? maxPrice : maxPrice - minPrice;
    }

    return {
      asks: asks.filter(x => x.x > 0),
      bids: bids.filter(x => x.x > 0),
      minPrice,
      maxPrice
    };
  }

  private getOrders(instrument: InstrumentKey): Observable<Order[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange)),
      map(x => x.allOrders.filter(o => o.symbol === instrument.symbol && o.exchange === instrument.exchange)),
      startWith([])
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }
}
