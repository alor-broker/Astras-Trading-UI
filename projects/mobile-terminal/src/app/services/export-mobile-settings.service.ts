import {
  inject,
  Injectable
} from '@angular/core';
import {
  ExportSettingsService,
  SettingsExportToFileResult
} from "@terminal-core-lib/features/export-settings/export-settings.types";
import {USER_CONTEXT} from "@terminal-core-lib/features/user-context/user-context.types";
import {
  Observable,
  take
} from "rxjs";
import {map} from "rxjs/operators";
import {LocalStorageService} from '@terminal-core-lib/features/local-storage/local-storage.service';
import {TerminalSettings} from "@terminal-core-lib/features/terminal-settings/terminal-settings.types";
import {WidgetSettings} from "@terminal-core-lib/features/widget-settings/widget-settings.types";
import {Dashboard} from "@terminal-core-lib/features/dashboard/types/dashboard.types";
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {LocalStorageMobileConstants} from '@terminal-core-lib/features/local-storage/local-storage.constants';

@Injectable()
export class ExportMobileSettingsService implements ExportSettingsService {
  private readonly userContext = inject(USER_CONTEXT);

  private readonly localStorageService = inject(LocalStorageService);

  private get filename(): string {
    return `ASTRAS_MOBILE_${Date.now()}`;
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
    return this.userContext.getUser().pipe(
      map(user => {
        const content = {
          login: user.login,
          terminalSettings: this.localStorageService.getItem<TerminalSettings>(LocalStorageMobileConstants.TerminalSettingsStorageKey) ?? null,
          widgetSettings: this.localStorageService.getItem<[string, WidgetSettings][]>(LocalStorageMobileConstants.WidgetsSettingsStorageKey) ?? [],
          dashboardSettings: this.localStorageService.getItem<Dashboard>(LocalStorageMobileConstants.DashboardsSettingsStorageKey) ?? null,
          instrumentsHistory: this.localStorageService.getItem<InstrumentKey[]>(LocalStorageMobileConstants.InstrumentsHistoryStorageKey) ?? []
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
