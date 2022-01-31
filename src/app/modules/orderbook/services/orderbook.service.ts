import { Injectable } from '@angular/core';
import { combineLatest, Observable, of, Subscription, zip,  } from 'rxjs';
import { catchError, combineLatestWith, debounceTime, filter, map, startWith, switchMap, take, tap, withLatestFrom } from 'rxjs/operators';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { BaseWebsocketService } from 'src/app/shared/services/base-websocket.service';
import { Order } from 'src/app/shared/models/orders/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderbookService extends BaseWebsocketService<OrderbookSettings> {
  private orderbook$: Observable<OrderBook> = new Observable();
  private instrumentSub?: Subscription;
  private orders: Map<string, Order> = new Map<string, Order>();

  constructor(ws: WebsocketService,
    settingsService: DashboardService,
    private sync: SyncService) {
      super(ws, settingsService);
  }

  generateNewGuid(request: OrderbookRequest) : string {
    const group = request.instrumentGroup ? request.instrumentGroup : '';
    return request.opcode + request.code + request.exchange + group + request.depth + request.format;
  }

  getOrderbook(guid: string) {
    this.instrumentSub = combineLatest([
      this.sync.selectedInstrument$,
      this.getSettings(guid)
    ]).pipe(
      map(([i, settings]) => {
        const shouldUpdate = (settings && settings.linkToActive &&
          !(settings.symbol == i.symbol &&
          settings.exchange == i.exchange &&
          settings.instrumentGroup == i.instrumentGroup));
        if (shouldUpdate) {
          this.setSettings({ ...settings, ...i });
        }
      })
    ).subscribe();

    const obData$ = this.getSettings(guid).pipe(
      filter((s): s is OrderbookSettings => !!s),
      switchMap((s) =>
        this.getOrderbookReq(
          s.symbol,
          s.exchange,
          s.instrumentGroup,
          s.depth
        )
      ),
      catchError((e,c) => {
        throw e;
      })
    )

    this.orderbook$ = combineLatest([obData$, this.getOrders()]).pipe(
      map(([ob, orders]) => {
        const withOrdersRows = ob.rows.map(row => {
          const askOrders = orders.filter(o => o.price == row.ask && o.status == 'working');
          const sumAsk = askOrders.map(o => o.qty).reduce((prev, curr) => prev + curr, 0);
          const askCancels = askOrders.map((o): CancelCommand => ({
            orderid: o.id,
            exchange: o.exchange,
            portfolio: o.portfolio,
            stop: false
          }))

          const bidOrders = orders.filter(o => o.price == row.bid && o.status == 'working');
          const sumBid = bidOrders.map(o => o.qty).reduce((prev, curr) => prev + curr, 0);
          const bidCancels = bidOrders.map((o): CancelCommand => ({
            orderid: o.id,
            exchange: o.exchange,
            portfolio: o.portfolio,
            stop: false
          }))
          row.askOrderVolume = sumAsk;
          row.askCancels = askCancels;
          row.bidOrderVolume = sumBid;
          row.bidCancels = bidCancels;
          return row;
        })
        return {...ob, rows: withOrdersRows};
      })
    )
    return this.orderbook$;
  }

  private getOrderbookReq(symbol: string, exchange: string, instrumentGroup?: string, depth?: number) {
    const request : OrderbookRequest = {
      opcode:"OrderBookGetAndSubscribe",
      code: symbol,
      exchange: exchange,
      depth: depth ?? 10,
      format:"simple",
      guid: '',
      instrumentGroup: instrumentGroup
    }
    request.guid = this.generateNewGuid(request);
    const messages$ = this.getEntity<OrderbookData>(request);

    const orderbook$ = messages$.pipe(
      map(r => {
        const rows = r.asks.map((a, i) => {
          const obr: OrderBookViewRow = {
            ask: a.price,
            askVolume: a.volume,
            bid: r.bids[i].price,
            bidVolume: r.bids[i].volume
          }
          return obr;
        })
        const volumes = [...rows.map(p => p?.askVolume ?? 0), ...rows.map(p => p?.bidVolume ?? 0)]
        const ob : OrderBook = {
          maxVolume: Math.max(...volumes),
          rows: rows
        }
        return ob;
      })
    )

    return orderbook$;
  }

  private getOrders() {
    const orders$ = this.sync.selectedPortfolio$.pipe(
      switchMap((p) => {
        if (p) {
          return this.getPortfolioEntity<Order>(p.portfolio, p.exchange, 'OrdersGetAndSubscribeV2').pipe(
            map((order: Order) => {
              this.orders.set(order.id, order);
              return Array.from(this.orders.values()).sort((o1, o2) => o2.id.localeCompare(o1.id));
            })
          )
        }
        return of([]);
      }),
      startWith([]),
    )
    return orders$;
  }
}
