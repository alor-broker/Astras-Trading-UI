import { TestBed } from '@angular/core/testing';

import { NetworkStatusService } from './network-status.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import {
  of,
  Subject
} from 'rxjs';
import { WsOrdersConnector } from 'src/app/client/services/orders/ws-orders-connector';

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
          provide: WsOrdersConnector,
          useValue: {
            lastOrderDelayMSec$: new Subject(),
            getConnectionStatus: jasmine.createSpy('getConnectionStatus').and.returnValue(of(true))
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
