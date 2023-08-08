import {TestBed} from '@angular/core/testing';

import {TerminalSettingsService} from './terminal-settings.service';

describe('TerminalSettingsService', () => {
  let service: TerminalSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TerminalSettingsService]
    });
    service = TestBed.inject(TerminalSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
