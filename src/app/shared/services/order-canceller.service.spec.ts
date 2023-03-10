import { HttpClient } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { OrderCancellerService } from './order-canceller.service';
import { InstantNotificationsService } from './instant-notifications.service';

describe('OrderCancellerService', () => {
  let service: OrderCancellerService;
  let http: HttpClient;


  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: InstantNotificationsService,
          useValue: {
            showNotification: jasmine.createSpy('showNotification').and.callThrough()
          }
        },
        OrderCancellerService
      ]
    });

    http = TestBed.inject(HttpClient);
    service = TestBed.inject(OrderCancellerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
