import {TestBed} from '@angular/core/testing';

import {TerminalSettingsService} from './terminal-settings.service';
import {commonTestProviders, sharedModuleImportForTests} from "../utils/testing";

describe('TerminalSettingsService', () => {
  let service: TerminalSettingsService;

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [...sharedModuleImportForTests],
      providers: [
        TerminalSettingsService,
        ...commonTestProviders
      ]
    });
    service = TestBed.inject(TerminalSettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
