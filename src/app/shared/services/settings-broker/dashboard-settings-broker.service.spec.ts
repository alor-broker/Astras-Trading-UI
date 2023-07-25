import { TestBed } from '@angular/core/testing';

import { DashboardSettingsBrokerService } from './dashboard-settings-broker.service';

describe('DashboardSettingsBrokerService', () => {
  let service: DashboardSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DashboardSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
