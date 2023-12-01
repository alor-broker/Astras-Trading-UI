import { UpdateBadgesDesktopDashboardMigration } from "./update-badges-desktop-dashboard.migration";
import { TestBed } from "@angular/core/testing";
import {
  of,
  take
} from "rxjs";
import { ExchangeSettings } from "../../../../shared/models/market-settings.model";
import { MarketService } from "../../../../shared/services/market.service";
import {
  Dashboard,
  InstrumentGroups
} from "../../../../shared/models/dashboard/dashboard.model";
import { generateRandomString } from "../../../../shared/utils/testing";
import { ReplacePatch } from "json-patch";
import { instrumentsBadges } from "../../../../shared/utils/instruments";

describe('UpdateBadgesDesktopDashboardMigration', () => {
  let migration: UpdateBadgesDesktopDashboardMigration;
  let markerServiceSpy = jasmine.createSpyObj('MarketService', ['getAllExchanges']);

  const defaultExchange = "MOEX";
  const defaultInstrument: {
    symbol: string;
    instrumentGroup?: string;
  } = {
    symbol: "SYMB",
    instrumentGroup: "IGRP"
  };

  markerServiceSpy.getAllExchanges.and.returnValue(of([
    {
      exchange: defaultExchange,
      settings: {
        isDefault: true,
        defaultInstrument
      }
    }
  ] as { exchange: string, settings: ExchangeSettings }[]));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: MarketService,
          useValue: markerServiceSpy
        }
      ]
    });

    migration = TestBed.inject(UpdateBadgesDesktopDashboardMigration);
  });

  it('should be created', () => {
    expect(migration).toBeTruthy();
  });

  it('should skip empty dashboard', () => {
    const patches$ = migration.getPatches([]);

    patches$.pipe(
      take(1)
    ).subscribe(x=> {
      expect(x.length).toBe(0);
    });
  });

  it('should update old badges', () => {
    const oldSelection: InstrumentGroups = {};

    UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap.forEach(x => {
      oldSelection[x.oldColor] = {
        exchange: "MOEX",
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4)
      };
    });

    const input: Dashboard[] = [
      {
        instrumentsSelection:oldSelection
      } as Dashboard
    ];

    const patches$ = migration.getPatches(input);

    patches$.pipe(
      take(1)
    ).subscribe(x=> {
      expect(x.length).toBe(1);

      const value = (<ReplacePatch>x[0]).value as InstrumentGroups;

      expect(Object.keys(value).length).toBe(instrumentsBadges.length);

      for (let oldKey of Object.keys(oldSelection)) {
        const oldInstrumentKey = oldSelection[oldKey];
        const expectedNewBadge = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap.find(x => x.oldColor === oldKey)!.newColor;

        const newInstrumentKey = value[expectedNewBadge];

        expect(newInstrumentKey.symbol).toBe(oldInstrumentKey.symbol);
      }
    });
  });

  it('should update mixed badges', () => {
    const oldSelection: InstrumentGroups = {};
    UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap.forEach(x => {
      oldSelection[x.oldColor] = {
        exchange: "MOEX",
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4)
      };
    });

    const newSelection: InstrumentGroups = {};
    instrumentsBadges.forEach(x => {
      newSelection[x] = {
        exchange: "MOEX",
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4)
      };
    });

    const input: Dashboard[] = [
      {
        instrumentsSelection:{
          ...oldSelection,
          ...newSelection
        }
      } as Dashboard
    ];

    const patches$ = migration.getPatches(input);

    patches$.pipe(
      take(1)
    ).subscribe(x=> {
      expect(x.length).toBe(1);

      const value = (<ReplacePatch>x[0]).value as InstrumentGroups;

      expect(Object.keys(value).length).toBe(instrumentsBadges.length);

      for (let newKey of Object.keys(value)) {
        expect(instrumentsBadges.includes(newKey)).toBeTrue();

        const newInstrumentKey = value[newKey];
        expect(newInstrumentKey.symbol).toBe(newSelection[newKey].symbol);
      }
    });
  });

  it('should skip if up to date', () => {
    const newSelection: InstrumentGroups = {};
    instrumentsBadges.forEach(x => {
      newSelection[x] = {
        exchange: "MOEX",
        symbol: generateRandomString(4),
        instrumentGroup: generateRandomString(4)
      };
    });

    const input: Dashboard[] = [
      {
        instrumentsSelection: newSelection
      } as Dashboard
    ];

    const patches$ = migration.getPatches(input);

    patches$.pipe(
      take(1)
    ).subscribe(x=> {
      expect(x.length).toBe(0);
    });
  });
});
