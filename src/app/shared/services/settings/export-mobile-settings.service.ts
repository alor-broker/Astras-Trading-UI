import {
  Inject,
  Injectable
} from '@angular/core';
import {
  ExportSettingsService,
  SettingsExportToFileResult
} from "./export-settings.service";
import {
  Observable,
  take
} from "rxjs";
import {
  USER_CONTEXT,
  UserContext
} from "../auth/user-context";
import { map } from "rxjs/operators";
import { LocalStorageService } from "../local-storage.service";
import { TerminalSettings } from "../../models/terminal-settings/terminal-settings.model";
import { LocalStorageMobileConstants } from "../../constants/local-storage.constants";
import { WidgetSettings } from "../../models/widget-settings.model";
import { Dashboard } from "../../models/dashboard/dashboard.model";
import { InstrumentKey } from "../../models/instruments/instrument-key.model";

@Injectable()
export class ExportMobileSettingsService implements ExportSettingsService {
  constructor(
    @Inject(USER_CONTEXT)
    private readonly userContext: UserContext,
    private readonly localStorageService: LocalStorageService) {
  }

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
          dashboardSettings:  this.localStorageService.getItem<Dashboard>(LocalStorageMobileConstants.DashboardsSettingsStorageKey) ?? null,
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
