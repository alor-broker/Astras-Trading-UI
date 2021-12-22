import { TestBed } from '@angular/core/testing';

import { LightChartService } from './light-chart.service';

describe('LightChartService', () => {
  let service: LightChartService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LightChartService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
