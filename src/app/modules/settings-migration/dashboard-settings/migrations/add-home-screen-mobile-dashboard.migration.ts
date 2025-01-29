import {Injectable} from "@angular/core";
import {MigrationBase} from "../../migration-base";
import {ApplyOptions, ApplyStrategyType} from "../../models/migration.model";
import {Observable, of} from "rxjs";
import jsonpatch, {AddPatch} from "json-patch";
import {Dashboard} from "../../../../shared/models/dashboard/dashboard.model";
import {Widget} from "../../../../shared/models/dashboard/widget.model";
import {GuidGenerator} from "../../../../shared/utils/guid";

@Injectable({
  providedIn: "root"
})
export class AddHomeScreenMobileDashboardSettings extends MigrationBase {
  readonly targetWidgetType = 'mobile-home-screen';

  get applyOptions(): ApplyOptions {
    // Jan 28, 2025
    const expirationDate = new Date(Date.UTC(2025, 0, 27));
    expirationDate.setMonth(expirationDate.getMonth() + 3);

    return {
      strategy: ApplyStrategyType.ApplyOnce,
      expirationDate: expirationDate
    };
  }

  get migrationId(): string {
    return "add_home_screen_mobile_dashboard_settings";
  }

  getPatches(current: unknown): Observable<jsonpatch.OpPatch[]> {
    if (!current) {
      return of([]);
    }

    const dashboard = current as Dashboard;
    const existing = dashboard.items.find(i => i.widgetType === this.targetWidgetType);
    if (existing != null) {
      return of([]);
    }

    const neighborIndex = dashboard.items.findIndex(i => i.widgetType === 'blotter');
    if (neighborIndex < 0) {
      return of([]);
    }

    const missingConfig: Widget = {
      guid: GuidGenerator.newGuid(),
      widgetType: this.targetWidgetType
    };

    const patch: AddPatch = {
      op: "add",
      path: `/items/${neighborIndex + 1}`,
      value: missingConfig
    };

    return of([patch]);
  }
}
