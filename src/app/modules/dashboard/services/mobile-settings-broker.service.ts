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
import { take } from "rxjs";
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
      WidgetSettingsEventsActions.updated,
      action => {
        this.localStorageService.setItem(this.widgetsSettingsStorageKey, action.settings.map(s => [s.guid, s]));
      }
    );

    const settingItems = this.localStorageService.getItem<[string, WidgetSettings][]>(this.widgetsSettingsStorageKey) ?? [];
    this.store.dispatch(WidgetSettingsInternalActions.init({ settings: settingItems.map(x => x[1]) }));
  }

  private initDashboardSettingsBroker(): void {
    this.addActionSubscription(
      MobileDashboardEventsActions.updated,
      action => {
        this.localStorageService.setItem(this.dashboardsSettingsStorageKey, action.dashboard);
      }
    );

    this.addActionSubscription(
      MobileDashboardEventsActions.instrumentsHistoryUpdated,
      action => {
        this.localStorageService.setItem(this.instrumentsHistoryStorageKey, action.instruments);
      }
    );

    const dashboard = this.localStorageService.getItem<Dashboard>(this.dashboardsSettingsStorageKey) ?? null;
    const history = this.localStorageService.getItem<InstrumentKey[]>(this.instrumentsHistoryStorageKey) ?? [];

    this.store.dispatch(MobileDashboardInternalActions.init({
      mobileDashboard: dashboard,
      instrumentsHistory: history
    }));
  }

  private initTerminalSettingsBroker(): void {
    this.addActionSubscription(
      TerminalSettingsServicesActions.update,
      () => {
        this.terminalSettingsService.getSettings(true).pipe(
          take(1),
        ).subscribe(settings => {
          this.localStorageService.setItem(this.terminalSettingsStorageKey, settings);
          this.store.dispatch(TerminalSettingsEventsActions.saveSuccess());
        });
      }
    );

    this.addActionSubscription(
      TerminalSettingsServicesActions.reset,
      () => {
        this.localStorageService.removeItem(this.terminalSettingsStorageKey);
        this.localStorageService.removeItem(this.widgetsSettingsStorageKey);
        this.localStorageService.removeItem(this.dashboardsSettingsStorageKey);
        this.localStorageService.removeItem(this.instrumentsHistoryStorageKey);

        this.store.dispatch(TerminalSettingsEventsActions.resetSuccess());
      }
    );

    const terminalSettings = this.localStorageService.getItem<TerminalSettings>(this.terminalSettingsStorageKey) ?? null;
    this.store.dispatch(TerminalSettingsInternalActions.init({ settings: terminalSettings ?? null }));
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
