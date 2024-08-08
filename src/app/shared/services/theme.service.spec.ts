import { TestBed } from '@angular/core/testing';

import { ThemeService } from './theme.service';
import { TerminalSettings } from '../models/terminal-settings/terminal-settings.model';
import { of } from 'rxjs';
import { ThemeType } from '../models/settings/theme-settings.model';
import {TerminalSettingsService} from "./terminal-settings.service";
import { provideHttpClientTesting } from "@angular/common/http/testing";
import { LocalStorageService } from "./local-storage.service";
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

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
    imports: [],
    providers: [
        {
            provide: TerminalSettingsService,
            useValue: terminalSettingsServiceSpy
        },
        {
            provide: LocalStorageService,
            useValue: {
                getStringItem: jasmine.createSpy('getStringItem').and.returnValue(''),
                setStringItem: jasmine.createSpy('setStringItem').and.callThrough()
            }
        },
        provideHttpClient(withInterceptorsFromDi()),
        provideHttpClientTesting()
    ]
});

    service = TestBed.inject(ThemeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
