import { TestBed } from '@angular/core/testing';

import { TechChartDatafeedService } from './tech-chart-datafeed.service';

describe('TechChartDatafeedService', () => {
  let service: TechChartDatafeedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TechChartDatafeedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
