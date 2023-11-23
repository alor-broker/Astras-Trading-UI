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
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { selectWidgetSettingsState } from "./widget-settings.selectors";
import { GuidGenerator } from "../../shared/utils/guid";
import {
  addWidgetSettings,
  initWidgetSettings,
  removeAllWidgetSettings,
  removeWidgetSettings,
  updateWidgetSettings
} from "./widget-settings.actions";
import { InstrumentsService } from "../../modules/instruments/services/instruments.service";
import { WidgetSettings } from '../../shared/models/widget-settings.model';
import { defaultBadgeColor } from "../../shared/utils/instruments";

describe('Widget Settings Store', () => {
  let store: Store;
  let localStorageServiceSpy: any;
  let instrumentsServiceSpy: any;

  const settingsStorageKey = 'settings';

  const getTestSettings = (length: number): WidgetSettings[] => {
    const settings: WidgetSettings[] = [];

    for (let i = 0; i < length; i++) {
      settings.push({
        guid: GuidGenerator.newGuid(),
        exchange: Math.random() > 0.5 ? 'MOEX' : 'SPBX',
        width: Math.round(Math.random() * 100),
        height: Math.round(Math.random() * 100),
        badgeColor: defaultBadgeColor
      });
    }

    return settings;
  };

  const initSettings = (settings: WidgetSettings[]): void => {
    store.dispatch(initWidgetSettings({settings}));
  };

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    localStorageServiceSpy = jasmine.createSpyObj('LocalStorageService', ['getItem', 'setItem']);
    instrumentsServiceSpy = jasmine.createSpyObj('InstrumentsService', ['getInstrument']);

    TestBed.configureTestingModule({
      imports: [
        ...sharedModuleImportForTests
      ],
      providers: [
        { provide: LocalStorageService, useValue: localStorageServiceSpy },
        { provide: InstrumentsService, useValue: instrumentsServiceSpy },
        ...commonTestProviders
      ]
    });

    store = TestBed.inject(Store);
  });

  it('settings should be read from local storage', fakeAsync(() => {
      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(settingsState.status).toEqual(EntityStatus.Initial);
      });

      tick();

      const expectedSettings = getTestSettings(5);
      initSettings(expectedSettings);
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(settingsState.status).toEqual(EntityStatus.Success);
        expect(Object.values(settingsState.entities)).toEqual(jasmine.objectContaining(expectedSettings));
      });

      tick();
    })
  );


  it('should correctly process addWidgetSettings action', fakeAsync(() => {
      const expectedSettings = getTestSettings(5);
      initSettings(expectedSettings);
      tick();

      const newSettings = getTestSettings(1)[0];
      const expectedState = [
        ...expectedSettings,
        newSettings
      ];

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, WidgetSettings][]) => {
        expect(key).toEqual(settingsStorageKey);
        expect(settings.map(x => x[1])).toEqual(expectedState);
      });

      store.dispatch(addWidgetSettings({ settings: [newSettings] }));
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities)).toEqual(jasmine.objectContaining(expectedState));
      });
    })
  );

  it('should correctly process updateWidgetSettings action', fakeAsync(() => {
      const expectedSettings = getTestSettings(5);
      initSettings(expectedSettings);
      tick();

      const updatedSettings: WidgetSettings = {
        ...expectedSettings[0],
        width: Math.random() * 100,
        height: Math.random() * 100
      };

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, WidgetSettings][]) => {
        expect(key).toEqual(settingsStorageKey);
        expect(settings.find(x => x[0] === updatedSettings.guid)![1]).toEqual(updatedSettings);
      });

      store.dispatch(updateWidgetSettings({
          settingGuid: updatedSettings.guid,
          changes: updatedSettings
        }
      ));

      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities)).toContain(updatedSettings);
      });
    })
  );

  it('should correctly process removeWidgetSettings action', fakeAsync(() => {
      const expectedSettings = getTestSettings(5);
      initSettings(expectedSettings);
      tick();

      const settingsToRemove = expectedSettings[0];

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, WidgetSettings][]) => {
        expect(key).toEqual(settingsStorageKey);
        expect(settings.find(x => x[0] === settingsToRemove.guid)).toBeUndefined();
      });

      store.dispatch(removeWidgetSettings({ settingGuids: [settingsToRemove.guid] }));

      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities)).not.toContain(settingsToRemove);
      });
    })
  );

  it('should correctly process removeAllWidgetSettings action', fakeAsync(() => {
      const expectedSettings = getTestSettings(5);
      initSettings(expectedSettings);
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities)).toEqual(jasmine.objectContaining(expectedSettings));
      });

      tick();

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, WidgetSettings][]) => {
        expect(key).toEqual(settingsStorageKey);
        expect(settings.length).toBe(0);
      });

      store.dispatch(removeAllWidgetSettings());
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities).length).toBe(0);
      });
    })
  );
});
