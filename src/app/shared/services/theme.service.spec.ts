import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { TerminalSettingsService } from '../../modules/terminal-settings/services/terminal-settings.service';
import { TerminalSettings } from '../models/terminal-settings/terminal-settings.model';
import { of } from 'rxjs';
import { ThemeType } from '../models/settings/theme-settings.model';

describe('ThemeService', () => {
  let service: ThemeService;

  let terminalSettingsServiceSpy: any;

  beforeEach(() => {
    terminalSettingsServiceSpy = jasmine.createSpyObj('TerminalSettingsService', ['getSettings']);
    terminalSettingsServiceSpy.getSettings.and.returnValue(of({
      designSettings: {
        theme: ThemeType.dark
      }
    } as TerminalSettings));
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: TerminalSettingsService, useValue: terminalSettingsServiceSpy}
      ]
    });

    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
