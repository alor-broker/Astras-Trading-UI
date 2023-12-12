
import {
  OpPatch,
  ReplacePatch
} from "json-patch";
import {
  Observable,
  of
} from "rxjs";
import { Injectable } from "@angular/core";
import { MigrationBase } from "../../migration-base";
import {
  ApplyOptions,
  ApplyStrategyType
} from "../../models/migration.model";
import { WidgetSettings } from "../../../../shared/models/widget-settings.model";
import { UpdateBadgesDesktopDashboardMigration } from "../../dashboard-settings/migrations/update-badges-desktop-dashboard.migration";
import {
  defaultBadgeColor,
  instrumentsBadges
} from "../../../../shared/utils/instruments";

@Injectable({
  providedIn: "root"
})
export class UpdateBadgesWidgetsSettingsMigration extends MigrationBase {
  get applyOptions(): ApplyOptions {
    // November 27, 2023
    const expirationDate = new Date(Date.UTC(2023, 10, 27));
    expirationDate.setMonth(expirationDate.getMonth() + 3);

    return {
      strategy: ApplyStrategyType.ApplyOnce,
      expirationDate: expirationDate
    };
  }

  get migrationId(): string {
    return "update_badge_colors_widget";
  }

  getPatches(current: unknown): Observable<OpPatch[]> {
    if (!Array.isArray(current)) {
      return of([]);
    }

    const patches: OpPatch[] = [];
    for (let index = 0; index < current.length; index++) {
      const patch = this.getPatchForItem(current[index] as WidgetSettings, index);
      if (patch != null) {
        patches.push(patch);
      }
    }

    return of(patches);
  }

  private getPatchForItem(item: WidgetSettings, itemIndex: number): OpPatch | null {
    if (item.badgeColor == null) {
      return null;
    }

    const oldColor = UpdateBadgesDesktopDashboardMigration.OldToNewBadgesMap.find(c => c.oldColor === item.badgeColor);
    if (oldColor != null) {
      return {
        op: 'replace',
        path: `/${itemIndex}/badgeColor`,
        value: oldColor.newColor
      } as ReplacePatch;
    }

    if (!instrumentsBadges.includes(item.badgeColor)) {
      return {
        op: 'replace',
        path: `/${itemIndex}/badgeColor`,
        value: defaultBadgeColor
      } as ReplacePatch;
    }

    return null;
  }
}
