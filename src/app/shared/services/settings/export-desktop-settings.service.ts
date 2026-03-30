import { Injectable, inject } from '@angular/core';
import {
  ExportSettingsService,
  SettingsExportToFileResult
} from "./export-settings.service";
import {
  combineLatest,
  Observable,
  take
} from "rxjs";
import {
  USER_CONTEXT,
  UserContext
} from "../auth/user-context";
import { map } from "rxjs/operators";
import { TerminalSettingsService } from "../terminal-settings.service";
import { WidgetSettingsService } from "../widget-settings.service";
import { ManageDashboardsService } from "../manage-dashboards.service";

@Injectable()
export class ExportDesktopSettingsService implements ExportSettingsService {
  private readonly userContext = inject<UserContext>(USER_CONTEXT);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly manageDashboardsService = inject(ManageDashboardsService);

  private get filename(): string {
    return `ASTRAS_DESKTOP_${Date.now()}`;
  }

  exportToFile(): Observable<SettingsExportToFileResult> {
    return this.prepareFileContent().pipe(
      take(1),
      map(content => {
        return {
          filename: this.filename,
          content
        };
      })
    );
  }

  private prepareFileContent(): Observable<string> {
    return combineLatest({
      user: this.userContext.getUser(),
      terminalSettings: this.terminalSettingsService.getSettings(),
      widgetSettings: this.widgetSettingsService.getAllSettings(),
      dashboardSettings: this.manageDashboardsService.allDashboards$
    }).pipe(
      map(x => {
        const content = {
          login: x.user.login,
          terminalSettings: x.terminalSettings,
          widgetSettings: x.widgetSettings,
          dashboardSettings: x.dashboardSettings
        };

        return JSON.stringify(
          content,
          null,
          4
        );
      })
    );
  }
}
