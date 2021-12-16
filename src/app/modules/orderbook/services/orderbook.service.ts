import { Injectable } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { OrderbookData } from '../models/orderbook-data.model';
import { OrderbookRequest } from '../models/orderbook-request.model';
import { OrderbookRow } from '../models/orderbook-row.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';

@Injectable({
  providedIn: 'root'
})
export class OrderbookService {

  // orderBook$: Observable<OrderBook> = interval(1000).pipe(
  //   map(_ => this.generateOrderBook())
  // );

  orderBook$: Observable<OrderBook>;

  constructor(private ws: WebsocketService) {
    this.ws.connect({
      reconnect: false,
      reconnectTimeout: 2000
    })

    const request : OrderbookRequest = {
      opcode:"OrderBookGetAndSubscribe",
      code:"SBER",
      exchange:"MOEX",
      depth: 10,
      format:"TV",
      guid: GuidGenerator.newGuid(),
    }

    this.ws.sendMessage(request)

    this.orderBook$ = this.ws.messages$.pipe(
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
  }

  private generateOrderBook() : OrderBook {
    const getRandom = () : OrderBookViewRow => {
      return {
        bidVolume: Math.floor(Math.random() * 100),
        bid: Math.floor(Math.random() * 10),
        ask: Math.floor(Math.random() * 100),
        askVolume: Math.floor(Math.random() * 10),
      }
    }
    const randomRows = Array.from(Array(5)).map(_ => getRandom());
    const volumes = [...randomRows.map(p => p?.askVolume ?? 0), ...randomRows.map(p => p?.bidVolume ?? 0)]
    return {
      rows: randomRows,
      maxVolume: Math.max(...volumes)
    }
  }

}
