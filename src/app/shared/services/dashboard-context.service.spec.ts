import { TestBed } from '@angular/core/testing';

import { DashboardContextService } from './dashboard-context.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../utils/testing';

describe('DashboardContextService', () => {
  let service: DashboardContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(DashboardContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
