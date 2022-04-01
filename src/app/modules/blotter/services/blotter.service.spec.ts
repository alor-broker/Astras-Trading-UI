import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { provideMockStore, MockStore } from '@ngrx/store/testing';
import { BlotterService } from './blotter.service';
import { SyncState } from 'src/app/shared/ngrx/reducers/sync.reducer';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';

describe('BlotterService', () => {
  let service: BlotterService;
  const spy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  const notificationSpy = jasmine.createSpyObj('OrdersNotificationsService', ['notificateOrderChange']);

  const initialState : SyncState = {
    instrument: {
      symbol: 'SBER',
      exchange: Exchanges.MOEX,
      instrumentGroup: 'TQBR',
      isin: 'RU0009029540'
    },
    portfolio: {
      portfolio: "D39004",
      exchange: Exchanges.MOEX
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: spy },
        { provide: OrdersNotificationsService, useValue: notificationSpy },
        provideMockStore({ initialState }),
      ]
    });
    service = TestBed.inject(BlotterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
