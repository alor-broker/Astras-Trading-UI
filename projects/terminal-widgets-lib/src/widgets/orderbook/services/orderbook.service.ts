import {
  inject,
  Injectable
} from '@angular/core';
import {SubscriptionsDataFeedService} from "@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service";
import {
  combineLatest,
  Observable
} from 'rxjs';
import {
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {QuotesService} from '@terminal-core-lib/features/instruments/services/quotes.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  ChartData,
  ChartPoint,
  CurrentOrder,
  OrderBook,
  OrderBookViewRow
} from '@terminal-widgets-lib/widgets/orderbook/types/orderbook.types';
import {PortfolioSubscriptionsService} from '@terminal-core-lib/features/portfolios/services/portfolio-subscriptions';
import {ORDER_COMMAND_SERVICE_TOKEN} from '@terminal-core-lib/features/orders/types/order-command-service.types';
import {OrderbookService as OrderbookSubscriptionService} from '@terminal-core-lib/features/instruments/services/orderbook.service';
import {Quote} from '@terminal-core-lib/features/instruments/services/quotes-service.types';
import {Order} from '@terminal-core-lib/features/portfolios/types/order.types';
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';

@Injectable()
export class OrderbookService {
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly orderCommandService = inject(ORDER_COMMAND_SERVICE_TOKEN);

  private readonly quotesService = inject(QuotesService);

  private readonly orderbookSubscriptionService = inject(OrderbookSubscriptionService)

  getOrderBook(targetInstrument: InstrumentKey, depth: number): Observable<OrderBook> {
    const ob$ = this.orderbookSubscriptionService.getOrderbookSubscription(
      targetInstrument.symbol,
      targetInstrument.exchange,
      targetInstrument.instrumentGroup,
      depth
    )
      .pipe(
        startWith({a: [], b: []}),
      );

    const lastQuote$ = this.quotesService.getLastQuoteInfo(targetInstrument.symbol, targetInstrument.exchange)
      .pipe(
        switchMap(q => this.quotesService.getQuotesSubscription(targetInstrument.symbol, targetInstrument.exchange)
          .pipe(
            startWith(q ?? {total_bid_vol: 0, total_ask_vol: 0} as Quote)
          )
        )
      );

    const obData$ = combineLatest([ob$, lastQuote$])
      .pipe(
        map(([ob, quote]) => this.toOrderBook(ob, quote))
      );

    return combineLatest([obData$, this.getOrders(targetInstrument)]).pipe(
      map(([ob, orders]) => {
        const withOrdersRows = ob.rows.map((row) => {
          const askOrders = row.ask != null
            ? this.getCurrentOrdersForItem(row.ask, orders)
            : [];

          const sumAsk = askOrders
            .map((o) => o.volume)
            .reduce((prev, curr) => prev + curr, 0);

          const bidOrders = row.bid != null
            ? this.getCurrentOrdersForItem(row.bid, orders)
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
        return {...ob, rows: withOrdersRows};
      })
    );
  }

  cancelOrder(order: CurrentOrder): void {
    this.orderCommandService.cancelOrders([{
      orderId: order.orderId,
      orderType: order.type,
      exchange: order.targetInstrument.exchange,
      portfolio: order.ownedPortfolio.portfolio
    }]).subscribe();
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

  private toOrderBook(orderBookData: OrderbookData, quote: Quote): OrderBook {
    const rows = this.toOrderBookRows(orderBookData);
    const volumes = [
      ...rows.map((p) => p.askVolume ?? 0),
      ...rows.map((p) => p.bidVolume ?? 0),
    ];

    return {
      maxVolume: Math.max(...volumes),
      rows: rows,
      chartData: this.makeChartData(rows),
      bidVolumes: quote?.total_bid_vol ?? 0,
      askVolumes: quote?.total_ask_vol ?? 0
    } as OrderBook;
  }

  private makeChartData(rows: OrderBookViewRow[]): ChartData {
    const asks = new Array<ChartPoint | null>(rows.length).fill(null);
    const bids = new Array<ChartPoint | null>(rows.length).fill(null);

    let j = 0;
    for (let k = rows.length - 1; k >= 0; k--) {
      const row = rows[k] as OrderBookViewRow | undefined;
      j++;
      for (let i = 0; i < j; i++) {
        if (row?.ask != null) {
          asks[i] =
            {
              y: (asks[i]?.y ?? 0) + (row?.askVolume ?? 0),
              x: (asks[i] as ChartPoint | undefined)?.x ?? row?.ask ?? 0,
            };
        }

        if (row?.bid != null) {
          bids[i] = {
            y: (bids[i]?.y ?? 0) + (row?.bidVolume ?? 0),
            x: (bids[i] as ChartPoint | undefined)?.x ?? row?.bid ?? 0,
          };
        }
      }
    }

    return {
      asks: asks.filter((x): x is ChartPoint => x != null),
      bids: bids.filter((x): x is ChartPoint => x != null),
    };
  }

  private getOrders(instrument: InstrumentKey): Observable<Order[]> {
    return this.getCurrentPortfolio().pipe(
      switchMap(p => this.portfolioSubscriptionsService.getOrdersSubscription(p.portfolio, p.exchange)),
      map(x => x.allOrders.filter(o => o.targetInstrument.symbol === instrument.symbol && o.targetInstrument.exchange === instrument.exchange)),
      startWith([])
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }

  private getCurrentOrdersForItem(itemPrice: number, orders: Order[]): CurrentOrder[] {
    const currentOrders = orders.filter(
      (o) => o.price === itemPrice
        && o.status === 'working'
    );

    return currentOrders.map(o => this.orderToCurrentOrder(o));
  }

  private orderToCurrentOrder(order: Order): CurrentOrder {
    return {
      orderId: order.id,
      targetInstrument: order.targetInstrument,
      ownedPortfolio: order.ownedPortfolio,
      price: order.price,
      volume: order.qty - (order.filledQtyBatch ?? 0),
      type: order.type,
      side: order.side
    } as CurrentOrder;
  }
}
