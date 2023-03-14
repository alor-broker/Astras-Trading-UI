import { TestBed } from '@angular/core/testing';

import { ScalperOrderBookDataContextService } from './scalper-order-book-data-context.service';
import { WidgetSettingsService } from '../../../shared/services/widget-settings.service';
import { Subject } from 'rxjs';
import { InstrumentsService } from '../../instruments/services/instruments.service';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import { AllTradesService } from '../../../shared/services/all-trades.service';
import { QuotesService } from '../../../shared/services/quotes.service';

describe('ScalperOrderBookDataContextService', () => {
  let service: ScalperOrderBookDataContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: WidgetSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: InstrumentsService,
          useValue: {
            getInstrument: jasmine.createSpy('getInstrument').and.returnValue(new Subject())
          }
        },
        {
          provide: DashboardContextService,
          useValue: {
            selectedPortfolio$: new Subject()
          }
        },
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getAllPositionsSubscription: jasmine.createSpy('getAllPositionsSubscription').and.returnValue(new Subject()),
            getOrdersSubscription: jasmine.createSpy('getOrdersSubscription').and.returnValue(new Subject()),
            getStopOrdersSubscription: jasmine.createSpy('getStopOrdersSubscription').and.returnValue(new Subject()),

          }
        },
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        },
        {
          provide: AllTradesService,
          useValue: {
            getNewTradesSubscription: jasmine.createSpy('getNewTradesSubscription').and.returnValue(new Subject())
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getLastPrice: jasmine.createSpy('getLastPrice').and.returnValue(new Subject())
          }
        },
      ]
    });
    service = TestBed.inject(ScalperOrderBookDataContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
