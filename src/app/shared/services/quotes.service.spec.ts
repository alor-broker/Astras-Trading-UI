import { TestBed } from '@angular/core/testing';
import { QuotesService } from './quotes.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { HttpClientTestingModule } from '@angular/common/http/testing';

describe('QuotesService', () => {
  let service: QuotesService;

  let subscriptionsDataFeedServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        { provide: SubscriptionsDataFeedService, useValue: subscriptionsDataFeedServiceSpy },
        {
          provide: ErrorHandlerService,
          useValue: {
            handleError: jasmine.createSpy('handleError').and.callThrough()
          }
        },
        QuotesService
      ],
    });

    service = TestBed.inject(QuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
