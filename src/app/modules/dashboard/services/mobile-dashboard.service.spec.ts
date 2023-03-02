import { TestBed } from '@angular/core/testing';

import { MobileDashboardService } from './mobile-dashboard.service';

describe('InstrumentsHistoryService', () => {
  let service: MobileDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MobileDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
