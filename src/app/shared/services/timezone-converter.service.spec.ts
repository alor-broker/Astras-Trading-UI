import { TestBed } from '@angular/core/testing';

import { TimezoneConverterService } from './timezone-converter.service';
import { TerminalSettingsService } from '../../modules/terminal-settings/services/terminal-settings.service';

describe('TimezoneConverterService', () => {
  let service: TimezoneConverterService;
  const terminalSettingsServiceSpy = jasmine.createSpyObj('TerminalSettingsService', ['getSettings']);

  beforeAll(() => TestBed.resetTestingModule());
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TerminalSettingsService, useValue: terminalSettingsServiceSpy },
        TimezoneConverterService
      ],
    });
    service = TestBed.inject(TimezoneConverterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
