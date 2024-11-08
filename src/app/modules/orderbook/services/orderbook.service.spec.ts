import { TestBed } from '@angular/core/testing';
import { OrderbookService } from './orderbook.service';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import {
  EMPTY,
  of,
  Subject
} from "rxjs";
import { QuotesService } from "../../../shared/services/quotes.service";
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";
import { commonTestProviders } from "../../../shared/utils/testing/common-test-providers";
import {
  ORDER_COMMAND_SERVICE_TOKEN,
} from "../../../shared/services/orders/order-command.service";

describe('OrderbookService', () => {
  let service: OrderbookService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    const portfolioSubscriptionsServiceSpy = jasmine.createSpyObj('PortfolioSubscriptionsService', ['getOrdersSubscription']);

    TestBed.configureTestingModule({
      imports: [],
      providers: [
        OrderbookService,
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getLastQuoteInfo: jasmine.createSpy('getLastQuoteInfo').and.returnValue(of(null)),
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        },
        { provide: PortfolioSubscriptionsService, useValue: portfolioSubscriptionsServiceSpy },
        {
          provide: ORDER_COMMAND_SERVICE_TOKEN,
          useValue: {
            cancelOrders: jasmine.createSpy('cancelOrders').and.returnValue(new Subject())
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: EMPTY
          }
        },
        ...commonTestProviders,
        OrderbookService
      ]
    });

    service = TestBed.inject(OrderbookService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
