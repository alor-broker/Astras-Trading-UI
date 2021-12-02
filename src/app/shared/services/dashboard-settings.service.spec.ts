import { TestBed } from '@angular/core/testing';

import { DashboardSettingsService } from './dashboard-settings.service';

describe('DashboardSettingsService', () => {
  let service: DashboardSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
