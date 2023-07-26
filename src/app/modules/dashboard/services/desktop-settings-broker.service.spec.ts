import { TestBed } from '@angular/core/testing';

import { DesktopSettingsBrokerService } from './desktop-settings-broker.service';

describe('DesktopSettingsBrokerService', () => {
  let service: DesktopSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DesktopSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
