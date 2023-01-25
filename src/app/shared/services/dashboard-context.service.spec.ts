import { TestBed } from '@angular/core/testing';

import { DashboardContextService } from './dashboard-context.service';
import { sharedModuleImportForTests } from '../utils/testing';

describe('CurrentDashboardService', () => {
  let service: DashboardContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests]
    });
    service = TestBed.inject(DashboardContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
