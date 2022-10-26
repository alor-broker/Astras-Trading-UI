import { TestBed } from '@angular/core/testing';

import { LightChartDatafeedFactoryService } from './light-chart-datafeed-factory.service';
import { WebsocketService } from '../../../shared/services/websocket.service';
import { HistoryService } from '../../../shared/services/history.service';

describe('LightChartDatafeedFactoryService', () => {
  let service: LightChartDatafeedFactoryService;

  let websocketServiceSpy: any;
  let historyServiceSpy: any;

  beforeEach(() => {
    websocketServiceSpy = jasmine.createSpy('WebsocketService');
    historyServiceSpy = jasmine.createSpy('HistoryService');
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: WebsocketService, useValue: websocketServiceSpy },
        { provide: HistoryService, useValue: historyServiceSpy },
      ]
    });
    service = TestBed.inject(LightChartDatafeedFactoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
