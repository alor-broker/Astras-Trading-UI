import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, Subscription } from 'rxjs';
import {
  catchError,
  filter,
  map,
  startWith,
  switchMap,
} from 'rxjs/operators';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { ChartData, ChartPoint, OrderBook } from '../models/orderbook.model';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { Order } from 'src/app/shared/models/orders/order.model';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { select, Store } from '@ngrx/store';
import { getSelectedInstrument } from '../../../store/instruments/instruments.selectors';
import { getSelectedPortfolio } from '../../../store/portfolios/portfolios.selectors';

@Injectable()
export class OrderbookService extends BaseWebsocketService<OrderbookSettings> {
  private orderbook$: Observable<OrderBook> = new Observable();
  private instrumentSub?: Subscription;
  private ordersById: Map<string, Order> = new Map<string, Order>();

  constructor(
    ws: WebsocketService,
    settingsService: DashboardService,
    private store: Store,
    private canceller: OrderCancellerService
  ) {
    super(ws, settingsService);
  }

  generateNewGuid(request: OrderbookRequest): string {
    const group = request.instrumentGroup ? request.instrumentGroup : '';
    return (
      request.opcode +
      request.code +
      request.exchange +
      group +
      request.depth +
      request.format
    );
  }

  getOrderbook(guid: string) {
    this.instrumentSub?.unsubscribe();
    this.instrumentSub = combineLatest([
      this.store.pipe(
        select(getSelectedInstrument),
      ),
      this.getSettings(guid),
    ])
      .pipe(
        filter(([i, settings]) => !!settings &&
          !!settings.linkToActive &&
          !(
            settings.symbol == i.symbol &&
            settings.exchange == i.exchange &&
            settings.instrumentGroup == i.instrumentGroup
          ))
      )
      .subscribe(([i, settings]) => {
        this.setSettings({...settings, ...i});
      });

    const obData$ = this.getSettings(guid).pipe(
      filter((s): s is OrderbookSettings => !!s),
      switchMap((s) =>
        this.getOrderbookReq(s.symbol, s.exchange, s.instrumentGroup, s.depth)
      ),
      catchError((e,) => {
        throw e;
      })
    );

    this.orderbook$ = combineLatest([obData$, this.getOrders()]).pipe(
      map(([ob, orders]) => {
        const withOrdersRows = ob.rows.map((row) => {
          const askOrders = orders.filter(
            (o) => o.price == row.ask && o.status == 'working'
          );
          const sumAsk = askOrders
            .map((o) => o.qty)
            .reduce((prev, curr) => prev + curr, 0);
          const askCancels = askOrders.map(
            (o): CancelCommand => ({
              orderid: o.id,
              exchange: o.exchange,
              portfolio: o.portfolio,
              stop: false,
            })
          );

          const bidOrders = orders.filter(
            (o) => o.price == row.bid && o.status == 'working'
          );
          const sumBid = bidOrders
            .map((o) => o.qty)
            .reduce((prev, curr) => prev + curr, 0);
          const bidCancels = bidOrders.map(
            (o): CancelCommand => ({
              orderid: o.id,
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
    return this.orderbook$;
  }

  cancelOrder(cancel: CancelCommand) {
    this.canceller.cancelOrder(cancel).subscribe();
  }

  private getOrderbookReq(
    symbol: string,
    exchange: string,
    instrumentGroup?: string,
    depth?: number
  ) {
    const request: OrderbookRequest = {
      opcode: 'OrderBookGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      depth: depth ?? 10,
      format: 'slim',
      guid: '',
      instrumentGroup: instrumentGroup,
    };
    request.guid = this.generateNewGuid(request);
    const messages$ = this.getEntity<OrderbookData>(request);

    const orderbook$ = messages$.pipe(
      map((r) => {
        const rows = r.a.map((a, i) => {
          const obr: OrderBookViewRow = {
            ask: a.p,
            askVolume: a.v,
            yieldAsk: a.y,
            yieldBid: r.b[i]?.y ?? 0,
            bid: r.b[i]?.p ?? 0,
            bidVolume: r.b[i]?.v ?? 0,
          };
          return obr;
        });
        const volumes = [
          ...rows.map((p) => p?.askVolume ?? 0),
          ...rows.map((p) => p?.bidVolume ?? 0),
        ];
        const ob: OrderBook = {
          maxVolume: Math.max(...volumes),
          rows: rows,
          chartData: this.makeChartData(rows),
        };
        return ob;
      })
    );

    return orderbook$;
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

  private getOrders() {
    const orders$ = this.store.select(getSelectedPortfolio).pipe(
      switchMap((p) => {
        if (p) {
          return this.getPortfolioEntity<Order>(
            p.portfolio,
            p.exchange,
            'OrdersGetAndSubscribeV2',
            true
          ).pipe(
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
    return orders$;
  }
}
