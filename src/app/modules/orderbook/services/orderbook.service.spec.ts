/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { of } from 'rxjs';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';
import { OrderbookService } from './orderbook.service';

describe('OrderbookService', () => {
  beforeEach(() => {
    const spy = jasmine.createSpyObj('WebsocketService', ['settings$']);
    spy.settings$ = of({
      exchange: 'MOEX',
      Symbol: 'SBER'
    })
    TestBed.configureTestingModule({
      providers: [
        OrderbookService,
        { provide: WebsocketService, useValue: spy }
      ]
    });
  });

  it('should ...', inject([OrderbookService], (service: OrderbookService) => {
    expect(service).toBeTruthy();
  }));
});

const generateOrderBook = () : OrderBook => {
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
