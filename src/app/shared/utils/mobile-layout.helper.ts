import {
  Observable,
  of,
  shareReplay,
  switchMap
} from "rxjs";
import {
  ClientDashboardType,
  DefaultMobileDashboardConfig,
  QuickAccessPanelItem
} from "../models/dashboard/dashboard.model";
import { ManageDashboardsService } from "../services/manage-dashboards.service";
import {
  filter,
  map
} from "rxjs/operators";
import { QuickAccessPanelWidget } from "../models/terminal-settings/terminal-settings.model";
import { TerminalSettingsService } from "../services/terminal-settings.service";

export class MobileLayoutHelper {
  static getDefaultQuickAccessPanelWidgets(manageDashboardsService: ManageDashboardsService): Observable<QuickAccessPanelItem[]> {
    return manageDashboardsService.getDashboardTemplatesConfig().pipe(
      map(c => {
        const mobileConfig = c.find(i => i.type === ClientDashboardType.ClientMobile) as DefaultMobileDashboardConfig | undefined;

        if (mobileConfig == null) {
          return null;
        }

        return mobileConfig.quickAccessPanelItems;
      }),
      filter(x => x != null),
      shareReplay(1)
    );
  }

  static getQuickAccessPanelWidgets(
    terminalSettingsService: TerminalSettingsService,
    manageDashboardsService: ManageDashboardsService
  ): Observable<QuickAccessPanelWidget[]> {
    return terminalSettingsService.getSettings().pipe(
      switchMap(s => {
        if (s.mobileDashboardLayout != null) {
          return of(s.mobileDashboardLayout.quickAccessPanelWidgets);
        }

        return this.getDefaultQuickAccessPanelWidgets(manageDashboardsService);
      }),
      shareReplay(1)
    );
  }
}
