import { TestBed } from '@angular/core/testing';

import { HotKeyCommandService } from './hot-key-command.service';
import { TerminalSettingsService } from "../../modules/terminal-settings/services/terminal-settings.service";
import { of } from "rxjs";

describe('HotKeyCommandService', () => {
  let service: HotKeyCommandService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(of({ hotKeysSettings: null }))
          }
        }
      ]
    });
    service = TestBed.inject(HotKeyCommandService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
