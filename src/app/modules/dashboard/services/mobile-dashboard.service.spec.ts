import { TestBed } from '@angular/core/testing';

import { MobileDashboardService } from './mobile-dashboard.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../../../shared/utils/testing";

describe('MobileDashboardService', () => {
  let service: MobileDashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(MobileDashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
