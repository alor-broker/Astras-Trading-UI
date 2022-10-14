import { Store } from "@ngrx/store";
import {
  fakeAsync,
  TestBed,
  tick
} from "@angular/core/testing";
import {
  generateRandomString,
  sharedModuleImportForTests
} from "../../shared/utils/testing";
import {
  of,
  take
} from "rxjs";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { selectWidgetSettingsState } from "./widget-settings.selectors";
import { WidgetFactoryService } from "../../shared/services/widget-factory.service";
import { AnySettings } from "../../shared/models/settings/any-settings.model";
import { GuidGenerator } from "../../shared/utils/guid";
import {
  addWidgetSettings,
  initWidgetSettings,
  removeAllWidgetSettings,
  removeWidgetSettings,
  updateWidgetSettings
} from "./widget-settings.actions";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { InstrumentsService } from "../../modules/instruments/services/instruments.service";
import { PortfolioKey } from "../../shared/models/portfolio-key.model";
import { selectNewPortfolio } from "../portfolios/portfolios.actions";
import { selectNewInstrumentByBadge } from "../instruments/instruments.actions";

describe('Widget Settings Store', () => {
  let store: Store;
  let widgetFactoryService: WidgetFactoryService;
  let localStorageServiceSpy: any;
  let instrumentsServiceSpy: any;

  const settingsStorageKey = 'settings';

  const getTestSettings = (length: number) => {
    const settings: AnySettings[] = [];

    for (let i = 0; i < length; i++) {
      settings.push({
        guid: GuidGenerator.newGuid(),
        exchange: Math.random() > 0.5 ? 'MOEX' : 'SPBX',
        width: Math.round(Math.random() * 100),
        height: Math.round(Math.random() * 100)
      });
    }

    return settings;
  };

  const initSettings = (settings: AnySettings[]) => {
    localStorageServiceSpy.getItem.and.callFake(() => {
      return settings.map(x => [x.guid, x]);
    });

    store.dispatch(initWidgetSettings());
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
        { provide: InstrumentsService, useValue: instrumentsServiceSpy }
      ]
    });

    store = TestBed.inject(Store);
    widgetFactoryService = TestBed.inject(WidgetFactoryService);
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

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, AnySettings][]) => {
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

      const updatedSettings: AnySettings = {
        ...expectedSettings[0],
        width: Math.random() * 100,
        height: Math.random() * 100
      };

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, AnySettings][]) => {
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

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, AnySettings][]) => {
        expect(key).toEqual(settingsStorageKey);
        expect(settings.find(x => x[0] === settingsToRemove.guid)).toBeUndefined();
      });

      store.dispatch(removeWidgetSettings({ settingGuid: settingsToRemove.guid }));

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

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, AnySettings][]) => {
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

  it('should correctly process instrument update', fakeAsync(() => {
      const instrumentDependentSettings: AnySettings = {
        ...getTestSettings(1)[0],
        symbol: generateRandomString(4),
        isin: generateRandomString(12),
        instrumentGroup: generateRandomString(4),
        // should be initially set to false because otherwise this setting will be updated with initial state selected instrument (SBER)
        linkToActive: false,
        badgeColor: 'yellow',
        shortName: 'shortName'
      };

      const instrumentInDependentSettings: AnySettings = {
        ...getTestSettings(1)[0],
        linkToActive: false
      };

      const expectedSettings = [
        { ...instrumentDependentSettings },
        { ...instrumentInDependentSettings }
      ];

      initSettings(expectedSettings);
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities))
          .withContext('Check state before update')
          .toEqual(expectedSettings);
      });

      tick();

      store.dispatch(updateWidgetSettings({
        settingGuid: instrumentDependentSettings.guid,
        changes: {
          linkToActive: true
        }
      }));

      instrumentDependentSettings.linkToActive = true;

      tick();

      const newInstrumentKey: InstrumentKey = {
        symbol: generateRandomString(4),
        exchange: Math.random() > 0.5 ? 'MOEX' : 'SPBX',
      };

      const instrumentDetails = {
        ...newInstrumentKey,
        shortName: 'shortName',
        description: 'description',
        instrumentGroup: 'instrumentGroup',
        isin: 'isin',
        currency: 'RUB',
        minstep: 1,
        lotsize: 100,
        cfiCode: 'cfiCode'
      };

      instrumentsServiceSpy.getInstrument.and.returnValue(of(instrumentDetails));

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, AnySettings][]) => {
        if (key === settingsStorageKey) {
          const allSettings = settings.map(x => x[1]);

          expect(allSettings.find(x => x?.guid === instrumentInDependentSettings.guid))
            .withContext('Check localStorage passed settings (instrumentInDependent)')
            .toEqual(instrumentInDependentSettings);

          expect(allSettings.find(x => x?.guid === instrumentDependentSettings.guid))
            .withContext('Check localStorage passed settings (instrumentDependent)')
            .toEqual({
              ...instrumentDependentSettings,
              ...newInstrumentKey,
              isin: instrumentDetails.isin,
              instrumentGroup: instrumentDetails.instrumentGroup
            });
        }
      });

      store.dispatch(selectNewInstrumentByBadge({ instrument: newInstrumentKey, badgeColor: 'yellow' }));
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        const settings = Object.values(settingsState.entities);

        expect(settings.find(x => x?.guid === instrumentInDependentSettings.guid)).toEqual(instrumentInDependentSettings);
        expect(settings.find(x => x?.guid === instrumentDependentSettings.guid)).toEqual({
          ...instrumentDependentSettings,
          ...newInstrumentKey,
          isin: instrumentDetails.isin,
          instrumentGroup: instrumentDetails.instrumentGroup
        });
      });
    })
  );

  it('should correctly process portfolio update', fakeAsync(() => {
      const portfolioDependentSettings: AnySettings = {
        ...getTestSettings(1)[0],
        linkToActive: true,
        portfolio: 'D1234'
      };


      const portfolioInDependentSettings: AnySettings = {
        ...getTestSettings(1)[0],
        linkToActive: false
      };


      const expectedSettings = [
        { ...portfolioDependentSettings },
        { ...portfolioInDependentSettings }
      ];

      initSettings(expectedSettings);
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        expect(Object.values(settingsState.entities))
          .withContext('Check state before update')
          .toEqual(expectedSettings);
      });

      tick();

      const newPortfolioKey: PortfolioKey = {
        portfolio: 'G3214',
        exchange: Math.random() > 0.5 ? 'MOEX' : 'SPBX',
      };

      localStorageServiceSpy.setItem.and.callFake((key: string, settings: [string, AnySettings][]) => {
        if (key !== 'settingsStorageKey') {
          return;
        }
        expect(key)
          .withContext('Check localStorage key')
          .toEqual(settingsStorageKey);

        const allSettings = settings.map(x => x[1]);

        expect(allSettings.find(x => x?.guid === portfolioInDependentSettings.guid))
          .withContext('Check localStorage passed settings (instrumentInDependent)')
          .toEqual(portfolioInDependentSettings);

        expect(allSettings.find(x => x?.guid === portfolioDependentSettings.guid))
          .withContext('Check localStorage passed settings (instrumentDependent)')
          .toEqual({
            ...portfolioDependentSettings,
            ...newPortfolioKey
          });
      });

      store.dispatch(selectNewPortfolio({ portfolio: newPortfolioKey }));
      tick();

      store.select(selectWidgetSettingsState).pipe(
        take(1)
      ).subscribe(settingsState => {
        const settings = Object.values(settingsState.entities);

        expect(settings.find(x => x?.guid === portfolioInDependentSettings.guid)).toEqual(portfolioInDependentSettings);
        expect(settings.find(x => x?.guid === portfolioDependentSettings.guid)).toEqual({
          ...portfolioDependentSettings,
          ...newPortfolioKey
        });
      });

      tick();

      expect(localStorageServiceSpy.setItem).toHaveBeenCalledWith(
        settingsStorageKey,
        jasmine.anything()
      );
    })
  );
});
