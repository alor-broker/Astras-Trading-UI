import { TestBed } from '@angular/core/testing';

import { MobileSettingsBrokerService } from './mobile-settings-broker.service';

describe('MobileSettingsBrokerService', () => {
  let service: MobileSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MobileSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
