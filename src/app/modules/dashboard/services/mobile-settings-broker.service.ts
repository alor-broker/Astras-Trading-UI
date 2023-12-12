import {
  DestroyRef,
  Injectable
} from '@angular/core';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ActionCreator } from "@ngrx/store/src/models";
import {
  Actions,
  ofType
} from "@ngrx/effects";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Store } from "@ngrx/store";
import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { Dashboard } from "../../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import {
  of,
  take
} from "rxjs";
import { filter } from "rxjs/operators";
import { TerminalSettings } from "../../../shared/models/terminal-settings/terminal-settings.model";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import {
  WidgetSettingsEventsActions,
  WidgetSettingsInternalActions
} from "../../../store/widget-settings/widget-settings.actions";
import {
  MobileDashboardEventsActions,
  MobileDashboardInternalActions
} from "../../../store/mobile-dashboard/mobile-dashboard-actions";
import {
  TerminalSettingsEventsActions,
  TerminalSettingsInternalActions,
  TerminalSettingsServicesActions
} from "../../../store/terminal-settings/terminal-settings.actions";
import { LocalStorageMobileConstants } from "../../../shared/constants/local-storage.constants";
import { DashboardSettingsMobileMigrationManager } from "../../settings-migration/dashboard-settings/dashboard-settings-mobile-migration-manager";
import { WidgetSettingsMobileMigrationManager } from "../../settings-migration/widget-settings/widget-settings-mobile-migration-manager";
import { TerminalSettingsMobileMigrationManager } from "../../settings-migration/terminal-settings/terminal-settings-mobile-migration-manager";

@Injectable({
  providedIn: 'root'
})
export class MobileSettingsBrokerService {
  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
    private readonly localStorageService: LocalStorageService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly dashboardSettingsMobileMigrationManager: DashboardSettingsMobileMigrationManager,
    private readonly widgetSettingsMobileMigrationManager: WidgetSettingsMobileMigrationManager,
    private readonly terminalSettingsMobileMigrationManager: TerminalSettingsMobileMigrationManager,
    private readonly destroyRef: DestroyRef
  ) {
  }

  initSettingsBrokers() {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();
  }

  private initWidgetSettingsBroker() {
    const saveSettings = (settings: WidgetSettings[]) => {
      this.localStorageService.setItem(LocalStorageMobileConstants.WidgetsSettingsStorageKey, settings.map(s => [s.guid, s]));
    };

    this.addActionSubscription(
      WidgetSettingsEventsActions.updated,
      action => {
        saveSettings(action.settings);
      }
    );

    const savedItems = this.localStorageService.getItem<[string, WidgetSettings][]>(LocalStorageMobileConstants.WidgetsSettingsStorageKey) ?? [];
    const settings = savedItems.map(x => x[1]);

    this.widgetSettingsMobileMigrationManager.applyMigrations<WidgetSettings[]>(
      settings,
      migrated => {
        saveSettings(migrated);
        return of(true);
      }
    ).pipe(
      take(1)
    ).subscribe(x => this.store.dispatch(WidgetSettingsInternalActions.init({ settings: x.updatedData })));
  }

  private initDashboardSettingsBroker() {
    const saveDashboard = (settings: Dashboard) => this.localStorageService.setItem(LocalStorageMobileConstants.DashboardsSettingsStorageKey, settings);

    this.addActionSubscription(
      MobileDashboardEventsActions.updated,
      action => {
        saveDashboard(action.dashboard);
      }
    );

    this.addActionSubscription(
      MobileDashboardEventsActions.instrumentsHistoryUpdated,
      action => {
        this.localStorageService.setItem(LocalStorageMobileConstants.InstrumentsHistoryStorageKey, action.instruments);
      }
    );

    const dashboard = this.localStorageService.getItem<Dashboard>(LocalStorageMobileConstants.DashboardsSettingsStorageKey) ?? null;
    const history = this.localStorageService.getItem<InstrumentKey[]>(LocalStorageMobileConstants.InstrumentsHistoryStorageKey) ?? [];

    if (!dashboard) {
      this.store.dispatch(MobileDashboardInternalActions.init({
        mobileDashboard: dashboard,
        instrumentsHistory: history
      }));

      return;
    }

    this.dashboardSettingsMobileMigrationManager.applyMigrations<Dashboard>(
      dashboard,
      migrated => {
        saveDashboard(migrated);
        return of(true);
      }
    ).pipe(
      take(1)
    ).subscribe(x => {
      this.store.dispatch(MobileDashboardInternalActions.init({
        mobileDashboard: x.updatedData,
        instrumentsHistory: history
      }));
    });
  }

  private initTerminalSettingsBroker() {
    const saveSettings = (settings: TerminalSettings) => this.localStorageService.setItem(LocalStorageMobileConstants.TerminalSettingsStorageKey, settings);

    this.addActionSubscription(
      TerminalSettingsServicesActions.update,
      () => {
        this.terminalSettingsService.getSettings(true).pipe(
          take(1),
          filter((x): x is TerminalSettings => !!x)
        ).subscribe(settings => {
          saveSettings(settings);
          this.store.dispatch(TerminalSettingsEventsActions.saveSuccess());
        });
      }
    );

    this.addActionSubscription(
      TerminalSettingsServicesActions.reset,
      () => {
        this.localStorageService.removeItem(LocalStorageMobileConstants.TerminalSettingsStorageKey);
        this.localStorageService.removeItem(LocalStorageMobileConstants.WidgetsSettingsStorageKey);
        this.localStorageService.removeItem(LocalStorageMobileConstants.DashboardsSettingsStorageKey);
        this.localStorageService.removeItem(LocalStorageMobileConstants.InstrumentsHistoryStorageKey);
        this.localStorageService.removeItem(LocalStorageMobileConstants.MigrationsSettingsStorageKey);

        this.store.dispatch(TerminalSettingsEventsActions.resetSuccess());
      }
    );

    const terminalSettings = this.localStorageService.getItem<TerminalSettings>(LocalStorageMobileConstants.TerminalSettingsStorageKey) ?? null;

    if (!terminalSettings) {
      this.store.dispatch(TerminalSettingsInternalActions.init({ settings: terminalSettings ?? null }));
      return;
    }

    this.terminalSettingsMobileMigrationManager.applyMigrations<TerminalSettings>(
      terminalSettings,
      migrated => {
        saveSettings(migrated);
        return of(true);
      }
    ).pipe(
      take(1)
    ).subscribe(x => this.store.dispatch(TerminalSettingsInternalActions.init({ settings: x.updatedData })));
  }

  private addActionSubscription<AC extends ActionCreator, U = ReturnType<AC>>(actionCreator: AC, callback: (action: U) => void) {
    this.actions$.pipe(
      ofType(actionCreator),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(action => {
      callback(<U>action);
    });
  }
}
