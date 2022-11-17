import { TestBed } from '@angular/core/testing';

import { ScalperOrderBookService } from './scalper-order-book.service';
import { sharedModuleImportForTests } from "../../../shared/utils/testing";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';

describe('ScalperOrderBookService', () => {
  let service: ScalperOrderBookService;

  let subscriptionsDataFeedServiceSpy: any;
  let portfolioSubscriptionsServiceSpy: any;

  beforeEach(() => {
    subscriptionsDataFeedServiceSpy = jasmine.createSpyObj('SubscriptionsDataFeedService', ['subscribe']);
    portfolioSubscriptionsServiceSpy = jasmine.createSpyObj('PortfolioSubscriptionsService', ['getOrdersSubscription']);
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        ScalperOrderBookService,
        { provide: SubscriptionsDataFeedService, useValue: subscriptionsDataFeedServiceSpy },
        { provide: PortfolioSubscriptionsService, useValue: portfolioSubscriptionsServiceSpy },
      ]
    });
    service = TestBed.inject(ScalperOrderBookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
