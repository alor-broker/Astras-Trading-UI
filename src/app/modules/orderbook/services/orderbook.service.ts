import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription,  } from 'rxjs';
import { filter, map, switchMap, tap } from 'rxjs/operators';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookSettings } from '../../../shared/models/settings/orderbook-settings.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';
import { SyncService } from 'src/app/shared/services/sync.service';

@Injectable({
  providedIn: 'root'
})
export class OrderbookService {
  private orderbook$: Observable<OrderBook> = new Observable();
  private subGuid?: string;
  private instrumentSub?: Subscription;
  private settings: BehaviorSubject<OrderbookSettings | null> = new BehaviorSubject<OrderbookSettings | null>(null);

  settings$ = this.settings.asObservable()

  constructor(private ws: WebsocketService, private sync: SyncService) {

  }

  setSettings(settings: OrderbookSettings) {
    this.settings.next(settings);
  }

  setLinked(isLinked: boolean) {
    const current = this.getSettings();
    if (current) {
      this.settings.next({ ...current, linkToActive: isLinked })
    }
  }

  getSettings() {
    return this.settings.getValue();
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

  getOrderbook() {
    this.instrumentSub = this.sync.selectedInstrument$.pipe(
      map((i) => {
        const current = this.settings.getValue();
        if (current && current.linkToActive &&
            !(current.symbol == i.symbol &&
            current.exchange == i.exchange &&
            current.instrumentGroup == i.instrumentGroup)
        ) {
          this.setSettings({ ...current, ...i });
        }
      })
    ).subscribe();
    this.orderbook$ = this.settings$.pipe(
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
