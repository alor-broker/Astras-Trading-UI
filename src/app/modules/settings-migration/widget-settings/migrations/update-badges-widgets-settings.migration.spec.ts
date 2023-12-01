import { UpdateBadgesWidgetsSettingsMigration } from "./update-badges-widgets-settings.migration";
import { TestBed } from "@angular/core/testing";
import { WidgetSettings } from "../../../../shared/models/widget-settings.model";
import { instrumentsBadges } from "../../../../shared/utils/instruments";
import { UpdateBadgesDesktopDashboardMigration } from "../../dashboard-settings/migrations/update-badges-desktop-dashboard.migration";
import { take } from "rxjs";
import { ReplacePatch } from "json-patch";

describe('UpdateBadgesWidgetsSettingsMigration', () => {
  let migration: UpdateBadgesWidgetsSettingsMigration;

  beforeEach(() => {
    TestBed.configureTestingModule({});

    migration = TestBed.inject(UpdateBadgesWidgetsSettingsMigration);
  });

  it('should be created', () => {
    expect(migration).toBeTruthy();
  });

  it('should update widget badges', () => {
    const badBadge = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap[0];
    const input: WidgetSettings[] = [
      {
        badgeColor: instrumentsBadges[0]
      } as WidgetSettings,
      {
        badgeColor: badBadge.oldColor,
      } as WidgetSettings
    ];

    migration.getPatches(input).pipe(
      take(1)
    ).subscribe(patches => {
      expect(patches.length).toBe(1);

      const patch = patches[0] as ReplacePatch;
      expect(patch.path).toBe('/1/badgeColor');

      expect(patch.value).toBe(badBadge.newColor);
    });
  });
});
