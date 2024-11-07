import {
  Store,
  StoreModule
} from "@ngrx/store";
import {
  fakeAsync,
  TestBed,
  tick
} from "@angular/core/testing";
import { take } from "rxjs";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { GuidGenerator } from "../../shared/utils/guid";
import { WidgetSettings } from '../../shared/models/widget-settings.model';
import { defaultBadgeColor } from "../../shared/utils/instruments";
import {
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from "./widget-settings.actions";
import { WidgetSettingsFeature } from "./widget-settings.reducer";
import { EffectsModule } from "@ngrx/effects";
import { WidgetSettingsEffects } from "./widget-settings.effects";

describe('Widget Settings Store', () => {
  let store: Store;

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
    store.dispatch(WidgetSettingsInternalActions.init({ settings }));
  };

  beforeAll(() => TestBed.resetTestingModule());

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StoreModule.forRoot({}),
        EffectsModule.forRoot(),
        StoreModule.forFeature(WidgetSettingsFeature),
        EffectsModule.forFeature([WidgetSettingsEffects])
      ],
      providers: []
    });

    store = TestBed.inject(Store);
  });

  it('settings should be read from local storage', fakeAsync(() => {
      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(settingsState.status).toEqual(EntityStatus.Initial);
      });

      tick();

      const expectedSettings = getTestSettings(5);
      initSettings(expectedSettings);
      tick();

      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
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

      store.dispatch(WidgetSettingsServiceActions.add({ settings: [newSettings] }));
      tick();

      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
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

      store.dispatch(WidgetSettingsServiceActions.updateContent({
          settingGuid: updatedSettings.guid,
          changes: updatedSettings
        }
      ));

      tick();

      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
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

      store.dispatch(WidgetSettingsServiceActions.remove({ settingGuids: [settingsToRemove.guid] }));

      tick();

      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
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

      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities)).toEqual(jasmine.objectContaining(expectedSettings));
      });

      tick();

      store.dispatch(WidgetSettingsServiceActions.removeAll());
      tick();

      store.select(WidgetSettingsFeature.selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities).length).toBe(0);
      });
    })
  );
});
