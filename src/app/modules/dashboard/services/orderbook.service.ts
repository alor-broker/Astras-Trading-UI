import { Injectable } from '@angular/core';
import { interval, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { OrderbookRow } from '../models/orderbook-row.model';
import { OrderBook } from '../models/orderbook.model';

@Injectable({
  providedIn: 'root',
})
export class OrderbookService {

  orderBook$: Observable<OrderBook> = interval(1000).pipe(
    map(_ => this.generateOrderBook())
  );

  bids$ = this.orderBook$.pipe(
    map(b => b.bids)
  )

  constructor() { }

  private generateOrderBook() : OrderBook {
    const getRandom = () : OrderbookRow => {
      return {
        volume: Math.floor(Math.random() * 100),
        price: Math.floor(Math.random() * 10)
      }
    }

    return {
      bids: Array.from(Array(5)).map(_ => getRandom()),
      asks: Array.from(Array(5)).map(_ => getRandom())
    }
  }

}
