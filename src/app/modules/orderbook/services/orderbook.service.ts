import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, merge, Observable, Subscription,  } from 'rxjs';
import { catchError, defaultIfEmpty, filter, map, switchMap, tap } from 'rxjs/operators';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookSettings, isEqual } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';
import { SyncService } from 'src/app/shared/services/sync.service';
import { BlotterService } from 'src/app/shared/services/blotter.service';
import { CancelCommand } from 'src/app/shared/models/commands/cancel-command.model';
import { WidgetSettingsService } from 'src/app/shared/services/widget-settings.service';

@Injectable({
  providedIn: 'root'
})
export class OrderbookService {
  private orderbook$: Observable<OrderBook> = new Observable();
  private subGuid?: string;
  private instrumentSub?: Subscription;
  private settings?: OrderbookSettings;

  constructor(private settingsService: WidgetSettingsService,
    private ws: WebsocketService,
    private sync: SyncService,
    private blotter: BlotterService) {

  }

  getSettings(guid: string) {
    return this.settingsService.getSettings(guid).pipe(
      filter((s): s is OrderbookSettings => !!s),
      tap(s => this.settings = s)
    );
  }

  setSettings(settings: OrderbookSettings) {
    this.settingsService.setSettings(settings.guid, settings);
  }

  setLinked(isLinked: boolean) {
    const current = this.getSettingsValue();
    if (current) {
      this.settingsService.setSettings(current.guid, { ...current, linkToActive: isLinked });
    }
  }

  getSettingsValue() {
    return this.settings;
  }

  unsubscribe() {
    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }
  }

  generateNewGuid(request: OrderbookRequest) : string {
    const group = request.instrumentGroup ? request.instrumentGroup : '';
    return request.opcode + request.code + request.exchange + group + request.depth + request.format;
  }

  getOrderbook(guid: string) {
    this.instrumentSub = this.sync.selectedInstrument$.pipe(
      map((i) => {
        const current = this.settings;
        if (current && current.linkToActive &&
            !(current.symbol == i.symbol &&
            current.exchange == i.exchange &&
            current.instrumentGroup == i.instrumentGroup)
        ) {
          this.setSettings({ ...current, ...i });
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
      )
    )

    const orders$ = this.blotter.getOrders().pipe(
      tap(orders => {
        console.log(orders)
      })
    );

    this.orderbook$ = combineLatest([obData$, orders$.pipe(defaultIfEmpty([]))]).pipe(
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
      }),
      // catchError((e, caught) => caught)
    )
    return this.orderbook$;
  }

  private getOrderbookReq(symbol: string, exchange: string, instrumentGroup?: string, depth?: number) {
    this.ws.connect()

    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }

    const request : OrderbookRequest = {
      opcode:"OrderBookGetAndSubscribe",
      code: symbol,
      exchange: exchange,
      depth: depth ?? 10,
      format:"simple",
      guid: '',
      instrumentGroup: instrumentGroup
    }
    this.subGuid = this.generateNewGuid(request);
    request.guid = this.subGuid;
    this.ws.subscribe(request)

    const orderbook$ = this.ws.messages$.pipe(
      filter(m => m.guid == this.subGuid),
      map(r => {
        const br = r as BaseResponse<OrderbookData>;
        const rows = br.data.asks.map((a, i) => {
          const obr: OrderBookViewRow = {
            ask: a.price,
            askVolume: a.volume,
            bid: br.data.bids[i].price,
            bidVolume: br.data.bids[i].volume
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
}
