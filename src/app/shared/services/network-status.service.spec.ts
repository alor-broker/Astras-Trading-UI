import { TestBed } from '@angular/core/testing';

import { NetworkStatusService } from './network-status.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {
  of,
  Subject
} from 'rxjs';
import { OrderService } from "./orders/order.service";
import { OrderCancellerService } from "./order-canceller.service";

describe('NetworkStatusService', () => {
  let service: NetworkStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            getConnectionStatus: jasmine.createSpy('getConnectionStatus').and.returnValue(of(true))
          }
        },
        {
          provide: OrderService,
          useValue: {
            lastOrderDelayMSec$: new Subject()
          }
        },
        {
          provide: OrderCancellerService,
          useValue: {
            lastRequestDelayMSec$: new Subject()
          }
        }
      ]
    });
    service = TestBed.inject(NetworkStatusService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
