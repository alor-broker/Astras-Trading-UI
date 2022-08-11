import { Injectable } from '@angular/core';
import {
  combineLatest,
  filter,
  Observable,
  of,
  take
} from 'rxjs';
import {
  catchError,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import {
  ChartData,
  ChartPoint,
  OrderBook
} from '../models/orderbook.model';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { Order } from 'src/app/shared/models/orders/order.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { Store } from '@ngrx/store';
import { getSelectedPortfolio } from '../../../store/portfolios/portfolios.selectors';
import { Side } from "../../../shared/models/enums/side.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { OrderBookDataFeedHelper } from "../utils/order-book-data-feed.helper";

@Injectable()
export class OrderbookService extends BaseWebsocketService {
  private ordersById: Map<string, Order> = new Map<string, Order>();

  constructor(
    ws: WebsocketService,
    private readonly store: Store,
    private readonly canceller: OrderCancellerService
  ) {
    super(ws);
  }

  getOrderBook(settings: OrderbookSettings): Observable<OrderBook> {
    const obData$ = this.getEntity<OrderbookData>(OrderBookDataFeedHelper.getRealtimeDateRequest(
      settings.guid,
      settings.symbol,
      settings.exchange,
      settings.instrumentGroup,
      settings.depth)).pipe(
      catchError((e,) => {
        throw e;
      }),
      map(ob => this.toOrderBook(ob))
    );

    return combineLatest([obData$, this.getOrders(settings, settings.guid)]).pipe(
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

  private getOrders(instrument: InstrumentKey, trackId: string) {
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
              this.ordersById.set(order.id, order);
              return Array.from(this.ordersById.values()).sort((o1, o2) =>
                o2.id.localeCompare(o1.id)
              );
            })
          );
        }

        return of([]);
      }),
      startWith([])
    );
  }

  private getCurrentPortfolio(): Observable<PortfolioKey> {
    return this.store.select(getSelectedPortfolio)
    .pipe(
      take(1),
      filter((p): p is PortfolioKey => !!p)
    );
  }
}
