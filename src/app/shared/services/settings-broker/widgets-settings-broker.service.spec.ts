import { TestBed } from '@angular/core/testing';

import { WidgetsSettingsBrokerService } from './widgets-settings-broker.service';

describe('WidgetsSettingsBrokerService', () => {
  let service: WidgetsSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(WidgetsSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
