import { TestBed } from '@angular/core/testing';

import { TerminalSettingsBrokerService } from './terminal-settings-broker.service';

describe('TerminalSettingsBrokerService', () => {
  let service: TerminalSettingsBrokerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerminalSettingsBrokerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
