import {
  OpPatch,
  ReplacePatch
} from "json-patch";
import {
  Observable,
  of
} from "rxjs";
import { Injectable } from "@angular/core";
import { defaultBadgeColor } from "../../../../shared/utils/instruments";
import { MigrationBase } from "../../migration-base";
import {
  Dashboard,
  InstrumentGroups
} from "../../../../shared/models/dashboard/dashboard.model";
import {
  ApplyOptions,
  ApplyStrategyType
} from "../../models/migration.model";

@Injectable({
  providedIn: "root"
})
export class UpdateBadgesMobileDashboardMigration extends MigrationBase {
  get migrationId(): string {
    return "update_badge_colors_dashboard_mobile";
  }

  get applyOptions(): ApplyOptions {
    // November 27, 2023
    const expirationDate = new Date(Date.UTC(2023, 10, 27));
    expirationDate.setMonth(expirationDate.getMonth() + 3);

    return {
      strategy: ApplyStrategyType.ApplyOnce,
      expirationDate: expirationDate
    };
  }

  getPatches(current: unknown): Observable<OpPatch[]> {
    if (!current) {
      return of([]);
    }

    const dashboard = current as Dashboard;
    if (dashboard.instrumentsSelection == null || dashboard.instrumentsSelection[defaultBadgeColor] != null) {
      return of([]);
    }

    const currentBadge = Object.keys(dashboard.instrumentsSelection).find(x => dashboard.instrumentsSelection![x] != null);

    if (currentBadge == null) {
      return of([]);
    }

    const newSelections: InstrumentGroups = {
      [defaultBadgeColor]: dashboard.instrumentsSelection[currentBadge]
    };

    const patch: ReplacePatch = {
      op: 'replace',
      path: '/instrumentsSelection',
      value: newSelections
    };

    return of([patch]);
  }
}
