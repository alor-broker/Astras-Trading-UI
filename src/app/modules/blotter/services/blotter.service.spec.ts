import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import { BlotterService } from './blotter.service';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { QuotesService } from '../../../shared/services/quotes.service';

describe('BlotterService', () => {
  let store: MockStore;
  let service: BlotterService;
  const wsSpy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  const notificationSpy = jasmine.createSpyObj('OrdersNotificationsService', ['notificateOrderChange']);
  const quotesSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: wsSpy },
        { provide: OrdersNotificationsService, useValue: notificationSpy },
        { provide: QuotesService, useValue: quotesSpy },
        provideMockStore(),
      ]
    });
    store = TestBed.inject(MockStore);
    service = TestBed.inject(BlotterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
