import { Store } from "@ngrx/store";
import {
  fakeAsync,
  TestBed,
  tick
} from "@angular/core/testing";
import {
  commonTestProviders,
  sharedModuleImportForTests
} from "../../shared/utils/testing";
import { take } from "rxjs";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { selectTerminalSettingsState } from "./terminal-settings.selectors";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import {
  initTerminalSettings,
  updateTerminalSettings
} from "./terminal-settings.actions";
import { TimezoneDisplayOption } from "../../shared/models/enums/timezone-display-option";
import { TerminalSettings } from "../../shared/models/terminal-settings/terminal-settings.model";

describe('Terminal Settings Store', () => {
  let store: Store;
  let localStorageServiceSpy: any;

  const terminalSettingsKey = 'terminalSettings';

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);

    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        ...commonTestProviders
      ]
    });

    store = TestBed.inject(Store);
  });

  it('settings should be read from local storage', fakeAsync(() => {
      store.select(selectTerminalSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(settingsState.status).toEqual(EntityStatus.Initial);
        expect(settingsState.settings).toBeUndefined();
      });

      tick();

      const expectedSettings = {
        timezoneDisplayOption: TimezoneDisplayOption.MskTime,
        userIdleDurationMin: 15
      } as TerminalSettings;

      localStorageServiceSpy.getItem.and.callFake((key: string) => {
        expect(key).toEqual(terminalSettingsKey);

        return expectedSettings;
      });

      store.dispatch(initTerminalSettings());
      tick();

      store.select(selectTerminalSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(settingsState.status).toEqual(EntityStatus.Success);
        expect(settingsState.settings).toEqual(jasmine.objectContaining(expectedSettings));
      });

      tick();
    })
  );

  it('should save settings on update', (done) => {
      localStorageServiceSpy.getItem.and.returnValue({
        timezoneDisplayOption: TimezoneDisplayOption.MskTime,
        userIdleDurationMin: 15
      } as TerminalSettings);

      store.dispatch(initTerminalSettings());

      const updatedSettings = {
        timezoneDisplayOption: TimezoneDisplayOption.LocalTime,
        userIdleDurationMin: 30
      } as TerminalSettings;

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: TerminalSettings) => {
        done();

        expect(key).toEqual(terminalSettingsKey);
        expect(settings).toEqual(jasmine.objectContaining(updatedSettings));
      });

      store.dispatch(updateTerminalSettings({
        updates: updatedSettings
      }));
    }
  );
});
