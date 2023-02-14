import { TestBed } from '@angular/core/testing';

import { AllTradesService } from './all-trades.service';
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';

describe('AllTradesService', () => {
  let service: AllTradesService;

  let subscriptionsDataFeedServiceSpy: any;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule
      ],
      providers: [
        AllTradesService,
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        { provide: SubscriptionsDataFeedService, useValue: subscriptionsDataFeedServiceSpy },
      ]
    });
    service = TestBed.inject(AllTradesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
