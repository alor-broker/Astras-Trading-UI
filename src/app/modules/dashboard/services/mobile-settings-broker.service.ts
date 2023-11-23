import { DestroyRef, Injectable } from '@angular/core';
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ActionCreator } from "@ngrx/store/src/models";
import { Actions, ofType } from "@ngrx/effects";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Store } from "@ngrx/store";
import * as WidgetSettingsActions from "../../../store/widget-settings/widget-settings.actions";
import { WidgetSettings } from "../../../shared/models/widget-settings.model";
import { MobileDashboardActions } from "../../../store/mobile-dashboard/mobile-dashboard-actions";
import { Dashboard } from "../../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../../shared/models/instruments/instrument-key.model";
import { TerminalSettingsActions } from "../../../store/terminal-settings/terminal-settings.actions";
import { take } from "rxjs";
import { TerminalSettings } from "../../../shared/models/terminal-settings/terminal-settings.model";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";

@Injectable({
  providedIn: 'root'
})
export class MobileSettingsBrokerService {
  private readonly widgetsSettingsStorageKey = 'settings';
  private readonly dashboardsSettingsStorageKey = 'mobile-dashboard';
  private readonly instrumentsHistoryStorageKey = 'instruments-history';
  private readonly terminalSettingsStorageKey = 'terminalSettings';

  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
    private readonly localStorageService: LocalStorageService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  initSettingsBrokers(): void {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();
  }

  private initWidgetSettingsBroker(): void {
    this.addActionSubscription(
      WidgetSettingsActions.settingsUpdated,
      action => {
        this.localStorageService.setItem(this.widgetsSettingsStorageKey, action.settings.map(s => [s.guid, s]));
      }
    );

    const settingItems = this.localStorageService.getItem<[string, WidgetSettings][]>(this.widgetsSettingsStorageKey) ?? [];
    this.store.dispatch(WidgetSettingsActions.initWidgetSettings({settings: settingItems.map(x => x[1])}));
  }

  private initDashboardSettingsBroker(): void {
    this.addActionSubscription(
      MobileDashboardActions.mobileDashboardUpdated,
      action => {
        this.localStorageService.setItem(this.dashboardsSettingsStorageKey, action.dashboard);
      }
    );

    this.addActionSubscription(
      MobileDashboardActions.instrumentsHistoryUpdated,
      action => {
        this.localStorageService.setItem(this.instrumentsHistoryStorageKey, action.instruments);
      }
    );

    const dashboard = this.localStorageService.getItem<Dashboard>(this.dashboardsSettingsStorageKey) ?? null;
    const history = this.localStorageService.getItem<InstrumentKey[]>(this.instrumentsHistoryStorageKey) ?? [];

    this.store.dispatch(MobileDashboardActions.initMobileDashboard({
      mobileDashboard: dashboard,
      instrumentsHistory: history
    }));
  }

  private initTerminalSettingsBroker(): void {
    this.addActionSubscription(
      TerminalSettingsActions.updateTerminalSettings,
      () => {
        this.terminalSettingsService.getSettings(true).pipe(
          take(1),
        ).subscribe(settings => {
          this.localStorageService.setItem(this.terminalSettingsStorageKey, settings);
          this.store.dispatch(TerminalSettingsActions.saveTerminalSettingsSuccess());
        });
      }
    );

    this.addActionSubscription(
      TerminalSettingsActions.reset,
      () => {
        this.localStorageService.removeItem(this.terminalSettingsStorageKey);
        this.localStorageService.removeItem(this.widgetsSettingsStorageKey);
        this.localStorageService.removeItem(this.dashboardsSettingsStorageKey);
        this.localStorageService.removeItem(this.instrumentsHistoryStorageKey);

        this.store.dispatch(TerminalSettingsActions.resetSuccess());
      }
    );

    const terminalSettings = this.localStorageService.getItem<TerminalSettings>(this.terminalSettingsStorageKey) ?? null;
    this.store.dispatch(TerminalSettingsActions.initTerminalSettings({settings: terminalSettings ?? null}));
  }

  private addActionSubscription<AC extends ActionCreator, U = ReturnType<AC>>(actionCreator: AC, callback: (action: U) => void): void {
    this.actions$.pipe(
      ofType(actionCreator),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(action => {
      callback(<U>action);
    });
  }
}
