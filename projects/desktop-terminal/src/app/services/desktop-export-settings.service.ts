import {
  inject,
  Injectable
} from '@angular/core';
import {
  USER_CONTEXT,
  UserContext
} from '@terminal-core-lib/features/user-context/user-context.types';
import {TerminalSettingsService} from '@terminal-core-lib/features/terminal-settings/services/terminal-settings.service';
import {WidgetSettingsService} from '@terminal-core-lib/features/widget-settings/services/widget-settings.service';
import {
  combineLatest,
  map,
  Observable,
  take
} from 'rxjs';
import {DesktopManageDashboardsService} from '@terminal-core-lib/features/dashboard/desktop/services/desktop-manage-dashboards.service';
import {
  ExportSettingsService,
  SettingsExportToFileResult
} from '@terminal-core-lib/features/export-settings/export-settings.types';

@Injectable()
export class DesktopExportSettingsService implements ExportSettingsService {
  private readonly userContext = inject<UserContext>(USER_CONTEXT);

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  private readonly widgetSettingsService = inject(WidgetSettingsService);

  private readonly manageDashboardsService = inject(DesktopManageDashboardsService);

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
