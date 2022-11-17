import { TestBed } from '@angular/core/testing';

import { PortfolioSubscriptionsService } from './portfolio-subscriptions.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { Subject } from 'rxjs';

describe('PortfolioSubscriptionsService', () => {
  let service: PortfolioSubscriptionsService;

  let subscriptionsDataFeedServiceSpy: any;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
    subscriptionsDataFeedServiceSpy.subscribe.and.returnValue(new Subject());
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SubscriptionsDataFeedService,
          useValue: subscriptionsDataFeedServiceSpy
        }
      ]
    });
    service = TestBed.inject(PortfolioSubscriptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
