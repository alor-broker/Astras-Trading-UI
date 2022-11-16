import { TestBed } from '@angular/core/testing';
import { QuotesService } from './quotes.service';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';

describe('QuotesService', () => {
  let service: QuotesService;

  let subscriptionsDataFeedServiceSpy: any;

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: SubscriptionsDataFeedService, useValue: subscriptionsDataFeedServiceSpy },
        QuotesService
      ],
    });

    service = TestBed.inject(QuotesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
