import { TestBed } from '@angular/core/testing';

import { PortfolioSummaryService } from './portfolio-summary.service';
import {PortfolioSubscriptionsService} from "./portfolio-subscriptions.service";
import {Subject} from "rxjs";
import {MarketService} from "./market.service";
import {QuotesService} from "./quotes.service";
import {TerminalSettingsService} from "./terminal-settings.service";

describe('PortfolioSummaryService', () => {
  let service: PortfolioSummaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: PortfolioSubscriptionsService,
          useValue: {
            getSummariesSubscription: jasmine.createSpy('getSummariesSubscription').and.returnValue(new Subject()),
            getSpectraRisksSubscription: jasmine.createSpy('getSpectraRisksSubscription').and.returnValue(new Subject()),
          }
        },
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: MarketService,
          useValue: {
            getExchangeSettings: jasmine.createSpy('getExchangeSettings').and.returnValue(new Subject())
          }
        },
        {
          provide: QuotesService,
          useValue: {
            getQuotes: jasmine.createSpy('getQuotes').and.returnValue(new Subject())
          }
        }
      ]
    });

    service = TestBed.inject(PortfolioSummaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
