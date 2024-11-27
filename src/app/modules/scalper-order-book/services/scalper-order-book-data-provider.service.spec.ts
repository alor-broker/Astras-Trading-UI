import { TestBed } from '@angular/core/testing';
import {
  NEVER,
  Subject
} from 'rxjs';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { ScalperOrderBookSettingsReadService } from "./scalper-order-book-settings-read.service";
import { MockProvider } from "ng-mocks";
import { ScalperOrderBookDataProvider } from "./scalper-order-book-data-provider.service";

describe('ScalperOrderBookDataProvider', () => {
  let service: ScalperOrderBookDataProvider;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(
          ScalperOrderBookSettingsReadService,
          {
            readSettings: jasmine.createSpy('readSettings').and.returnValue(NEVER)
          }
        ),
        MockProvider(
          DashboardContextService,
          {
            selectedPortfolio$: new Subject()
          }
        ),
        MockProvider(
          PortfolioSubscriptionsService,
          {
            getAllPositionsSubscription: jasmine.createSpy('getAllPositionsSubscription').and.returnValue(new Subject()),
            getOrdersSubscription: jasmine.createSpy('getOrdersSubscription').and.returnValue(new Subject()),
            getStopOrdersSubscription: jasmine.createSpy('getStopOrdersSubscription').and.returnValue(new Subject()),

          }
        ),
        MockProvider(
          SubscriptionsDataFeedService,
          {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        )
      ]
    });
    service = TestBed.inject(ScalperOrderBookDataProvider);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
