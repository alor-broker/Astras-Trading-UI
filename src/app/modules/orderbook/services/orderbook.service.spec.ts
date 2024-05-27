import { TestBed } from '@angular/core/testing';
import { OrderbookService } from './orderbook.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../../../shared/utils/testing';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { of, Subject } from "rxjs";
import { QuotesService } from "../../../shared/services/quotes.service";
import { WsOrdersService } from "../../../shared/services/orders/ws-orders.service";

describe('OrderbookService', () => {
  let service: OrderbookService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    const portfolioSubscriptionsServiceSpy = jasmine.createSpyObj('PortfolioSubscriptionsService', ['getOrdersSubscription']);

    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
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
          provide: WsOrdersService,
          useValue: {
            cancelOrders: jasmine.createSpy('cancelOrders').and.returnValue(new Subject())
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
