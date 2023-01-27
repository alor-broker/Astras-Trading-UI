import { TestBed } from '@angular/core/testing';

import { NetworkStatusService } from './network-status.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { of } from 'rxjs';

describe('NetworkStatusService', () => {
  let service: NetworkStatusService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            getConnectionStatus: jasmine.createSpy('getConnectionStatus').and.returnValue(of(1))
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
