import { TestBed } from '@angular/core/testing';

import { TerminalSettingsService } from './terminal-settings.service';

describe('TerminalSettingsService', () => {
  let service: TerminalSettingsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TerminalSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
