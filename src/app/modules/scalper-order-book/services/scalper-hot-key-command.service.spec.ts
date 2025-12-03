import { DOCUMENT } from '@angular/core';
import {
  fakeAsync,
  TestBed,
  tick
} from '@angular/core/testing';
import { ScalperHotKeyCommandService } from "./scalper-hot-key-command.service";
import {
  BehaviorSubject,
  take
} from "rxjs";
import {
  ActiveOrderBookHotKeysTypes,
  AllOrderBooksHotKeysTypes,
  HotKeyMeta,
  HotKeysSettings,
  TerminalSettings
} from "../../../shared/models/terminal-settings/terminal-settings.model";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";

import { TerminalSettingsHelper } from "../../../shared/utils/terminal-settings-helper";

describe('ScalperHotKeyCommandService', () => {
  let service: ScalperHotKeyCommandService;
  let document: Document;

  const terminalSettingsMock = new BehaviorSubject<TerminalSettings>({ hotKeysSettings: {} } as TerminalSettings);

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: TerminalSettingsService,
          useValue: {
            getSettings: jasmine.createSpy('getSettings').and.returnValue(terminalSettingsMock)
          }
        }
      ]
    });

    service = TestBed.inject(ScalperHotKeyCommandService);
    document = TestBed.inject(DOCUMENT);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should process all hot keys', fakeAsync(() => {
      service.commands$.subscribe();

      const hotKeysSettings: HotKeysSettings = {
        ...TerminalSettingsHelper.getDefaultHotkeys(),
        extraHotKeys: false
      };

      terminalSettingsMock.next({
        hotKeysSettings: hotKeysSettings
      } as TerminalSettings);

      [
        ...Object.keys(AllOrderBooksHotKeysTypes),
        ...Object.keys(ActiveOrderBookHotKeysTypes)
      ].forEach(key => {
        const item = hotKeysSettings[key as keyof HotKeysSettings] as HotKeyMeta | undefined;

        if (item == null) {
          return;
        }

        const event = new KeyboardEvent(
          'keydown',
          {
            key: item.key,
            shiftKey: item.shiftKey ?? false,
            ctrlKey: item.ctrlKey ?? false,
            altKey: item.altKey ?? false,
          });
        service.commands$.pipe(
          take(1)
        ).subscribe(command => {
          expect(command.type).toBe(key);
        });

        document.body.dispatchEvent(event);
        tick();
      });
    })
  );
});
