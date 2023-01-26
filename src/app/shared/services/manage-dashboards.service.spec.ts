import { TestBed } from '@angular/core/testing';

import { ManageDashboardsService } from './manage-dashboards.service';
import { LocalStorageService } from "./local-storage.service";
import { Subject } from "rxjs";
import { DashboardContextService } from './dashboard-context.service';
import { sharedModuleImportForTests } from '../utils/testing';

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
            provide: LocalStorageService,
            useValue: jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem', 'removeItem'])
          },
          {
            provide: DashboardContextService,
            useValue: {
              selectedDashboard$: new Subject()
            }
          },
        ]
    });

    service = TestBed.inject(ManageDashboardsService);

  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
