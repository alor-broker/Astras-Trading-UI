import { TestBed } from '@angular/core/testing';

import { MobileDashboardService } from './mobile-dashboard.service';
import { sharedModuleImportForTests } from "../../../shared/utils/testing";

describe('InstrumentsHistoryService', () => {
  let service: MobileDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests]
    });
    service = TestBed.inject(MobileDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
