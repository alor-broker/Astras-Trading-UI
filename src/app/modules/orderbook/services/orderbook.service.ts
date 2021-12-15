import { Injectable } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { OrderbookRow } from '../models/orderbook-row.model';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';

@Injectable({
  providedIn: 'root'
})
export class OrderbookService {

  orderBook$: Observable<OrderBook> = interval(1000).pipe(
    map(_ => this.generateOrderBook())
  );

  constructor() { }

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
