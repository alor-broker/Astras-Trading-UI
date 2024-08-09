import { TestBed } from '@angular/core/testing';

import { ManageDashboardsService } from './manage-dashboards.service';
import { Subject } from "rxjs";
import { DashboardContextService } from './dashboard-context.service';
import {
  commonTestProviders,
  sharedModuleImportForTests
} from '../utils/testing';
import { EnvironmentService } from "./environment.service";

describe('ManageDashboardsService', () => {
  let service: ManageDashboardsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers:
        [
          ManageDashboardsService,
          {
            provide: EnvironmentService,
            useValue: {
              clientDataUrl: ''
            }
          },
          {
            provide: DashboardContextService,
            useValue: {
              selectedDashboard$: new Subject()
            }
          },
          ...commonTestProviders
        ]
    });

    service = TestBed.inject(ManageDashboardsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
