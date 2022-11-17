import { TestBed } from '@angular/core/testing';
import { BlotterService } from './blotter.service';
import { OrdersNotificationsService } from 'src/app/shared/services/orders-notifications.service';
import { QuotesService } from '../../../shared/services/quotes.service';
import { sharedModuleImportForTests } from '../../../shared/utils/testing';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { Subject } from 'rxjs';

describe('BlotterService', () => {
  let service: BlotterService;
  const notificationSpy = jasmine.createSpyObj('OrdersNotificationsService', ['notificateOrderChange']);
  const quotesSpy = jasmine.createSpyObj('QuotesService', ['getQuotes']);
  const portfolioSubscriptionsServiceSpy = jasmine.createSpyObj(
    'PortfolioSubscriptionsService',
    [
      'getSummariesSubscription',
      'getSpectraRisksSubscription',
      'getTradesSubscription',
      'getAllPositionsSubscription',
      'getOrdersSubscription',
      'getStopOrdersSubscription'
    ]
  );

  portfolioSubscriptionsServiceSpy.getSummariesSubscription.and.returnValue(new Subject());
  portfolioSubscriptionsServiceSpy.getSpectraRisksSubscription.and.returnValue(new Subject());
  portfolioSubscriptionsServiceSpy.getTradesSubscription.and.returnValue(new Subject());
  portfolioSubscriptionsServiceSpy.getAllPositionsSubscription.and.returnValue(new Subject());
  portfolioSubscriptionsServiceSpy.getOrdersSubscription.and.returnValue(new Subject());
  portfolioSubscriptionsServiceSpy.getStopOrdersSubscription.and.returnValue(new Subject());

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        { provide: PortfolioSubscriptionsService, useValue: portfolioSubscriptionsServiceSpy },
        { provide: OrdersNotificationsService, useValue: notificationSpy },
        { provide: QuotesService, useValue: quotesSpy },
        BlotterService
      ]
    });

    service = TestBed.inject(BlotterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
