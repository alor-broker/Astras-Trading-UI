import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { OrderCancellerService } from 'src/app/shared/services/order-canceller.service';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { OrderBookViewRow } from '../models/orderbook-view-row.model';
import { OrderBook } from '../models/orderbook.model';
import { OrderbookService } from './orderbook.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';

describe('OrderbookService', () => {
  let service: OrderbookService;
  const dashboardSpy = jasmine.createSpyObj('DashboardService', ['getSettings']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    const spy = jasmine.createSpyObj('WebsocketService', ['settings$']);
    const cancellerSpy = jasmine.createSpyObj('OrderCancellerService', ['cancelOrder']);
    spy.settings$ = of({
      exchange: 'MOEX',
      Symbol: 'SBER'
    });

    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        OrderbookService,
        { provide: WebsocketService, useValue: spy },
        { provide: OrderCancellerService, useValue: cancellerSpy },
        { provide: DashboardService, useValue: dashboardSpy },
        OrderbookService
      ]
    });

    service = TestBed.inject(OrderbookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

const generateOrderBook = (): OrderBook => {
  const getRandom = (): OrderBookViewRow => {
    return {
      bidVolume: Math.floor(Math.random() * 100),
      bid: Math.floor(Math.random() * 10),
      ask: Math.floor(Math.random() * 100),
      askVolume: Math.floor(Math.random() * 10),
    };
  };
  const randomRows = Array.from(Array(5)).map(_ => getRandom());
  const volumes = [...randomRows.map(p => p?.askVolume ?? 0), ...randomRows.map(p => p?.bidVolume ?? 0)];
  return {
    rows: randomRows,
    maxVolume: Math.max(...volumes),
    chartData: {
      maxPrice: 400,
      minPrice: 200,
      asks: [{ y: 200, x: 300 },
        { y: 1000, x: 310 },
        { y: 1700, x: 320 },
        { y: 2500, x: 340 },
        { y: 6400, x: 350 },
        { y: 7800, x: 380 },
        { y: 9000, x: 400 },],
      bids: [{ y: 10000, x: 200 },
        { y: 4000, x: 220 },
        { y: 2200, x: 240 },
        { y: 1800, x: 250 },
        { y: 1700, x: 280 },
        { y: 500, x: 290 },
        { y: 200, x: 298 },]
    }
  };
};
