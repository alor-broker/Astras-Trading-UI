import { TestBed } from '@angular/core/testing';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { BlotterService } from './blotter.service';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { QuotesService } from '../../../shared/services/quotes.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';

describe('BlotterService', () => {
  let service: BlotterService;
  const wsSpy = jasmine.createSpyObj('WebsocketService', ['unsubscribe', 'connect', 'subscribe', 'messages$']);
  const notificationSpy = jasmine.createSpyObj('OrdersNotificationsService', ['notificateOrderChange']);
  const quotesSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        { provide: WebsocketService, useValue: wsSpy },
        { provide: OrdersNotificationsService, useValue: notificationSpy },
        { provide: QuotesService, useValue: quotesSpy },
        BlotterService
      ]
    });

    service = TestBed.inject(BlotterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
