import { TestBed } from '@angular/core/testing';

import { LightChartDatafeedFactoryService } from './light-chart-datafeed-factory.service';
import { HistoryService } from '../../../shared/services/history.service';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import {Subject} from "rxjs";

describe('LightChartDatafeedFactoryService', () => {
  let service: LightChartDatafeedFactoryService;
  let historyServiceSpy: any;

  beforeEach(() => {
    historyServiceSpy = jasmine.createSpy('HistoryService');
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SubscriptionsDataFeedService,
          useValue: {
            subscribe: jasmine.createSpy('subscribe').and.returnValue(new Subject())
          }
        },
        { provide: HistoryService, useValue: historyServiceSpy },
      ]
    });
    service = TestBed.inject(LightChartDatafeedFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
