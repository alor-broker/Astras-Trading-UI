import { UpdateBadgesMobileDashboardMigration } from "./update-badges-mobile-dashboard.migration";
import { TestBed } from "@angular/core/testing";
import { take } from "rxjs";
import {
  Dashboard,
  InstrumentGroups
} from "../../../../shared/models/dashboard/dashboard.model";
import { UpdateBadgesDesktopDashboardMigration } from "./update-badges-desktop-dashboard.migration";
import { InstrumentKey } from "../../../../shared/models/instruments/instrument-key.model";
import { ReplacePatch } from "json-patch";
import { TestingHelpers } from "../../../../shared/utils/testing/testing-helpers";

describe('UpdateBadgesMobileDashboardMigration', () => {
  let migration: UpdateBadgesMobileDashboardMigration;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    migration = TestBed.inject(UpdateBadgesMobileDashboardMigration);
  });

  it('should be created', () => {
    expect(migration).toBeTruthy();
  });

  it('should skip empty dashboard', () => {
    const patches$ = migration.getPatches(null);

    patches$.pipe(
      take(1)
    ).subscribe(x => {
      expect(x.length).toBe(0);
    });
  });

  it('should update old badges', () => {
    const oldInstrumentKey: InstrumentKey = {
      symbol: TestingHelpers.generateRandomString(4),
      instrumentGroup: TestingHelpers.generateRandomString(4),
      exchange: TestingHelpers.generateRandomString(4)
    };

    const oldBadge = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap[0];
    const oldSelection: InstrumentGroups = {
      [oldBadge.oldColor]: oldInstrumentKey
    };

    const testDashboard = {
      instrumentsSelection: oldSelection
    } as Dashboard;

    migration.getPatches(testDashboard).pipe(
      take(1)
    ).subscribe(x => {
      expect(x.length).toBe(1);

      const patch = x[0] as ReplacePatch;

      expect(patch.path).toBe('/instrumentsSelection');
      expect(patch.value).toEqual({
        [oldBadge.newColor]: oldInstrumentKey
      } as InstrumentGroups);
    });
  });

  it('should skip if up to date', () => {
    const oldInstrumentKey: InstrumentKey = {
      symbol: TestingHelpers.generateRandomString(4),
      instrumentGroup: TestingHelpers.generateRandomString(4),
      exchange: TestingHelpers.generateRandomString(4)
    };

    const oldBadge = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap[0];
    const oldSelection: InstrumentGroups = {
      [oldBadge.newColor]: oldInstrumentKey
    };

    const testDashboard = {
      instrumentsSelection: oldSelection
    } as Dashboard;

    migration.getPatches(testDashboard).pipe(
      take(1)
    ).subscribe(x => {
      expect(x.length).toBe(0);
    });
  });
});
