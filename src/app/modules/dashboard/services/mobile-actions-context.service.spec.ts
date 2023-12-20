import { TestBed } from '@angular/core/testing';

import { MobileActionsContextService } from './mobile-actions-context.service';
import { DashboardContextService } from "../../../shared/services/dashboard-context.service";

describe('MobileActionsContextService', () => {
  let service: MobileActionsContextService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: DashboardContextService,
          useValue: {
            selectDashboardInstrument: jasmine.createSpy('selectDashboardInstrument').and.callThrough()
          }
        },
        MobileActionsContextService
      ]
    });
    service = TestBed.inject(MobileActionsContextService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
