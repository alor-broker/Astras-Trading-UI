import {DestroyRef, Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Actions, ofType} from '@ngrx/effects';
import {ActionCreator, Store} from '@ngrx/store';
import {take} from 'rxjs';
import {LocalStorageAdminConstants} from 'src/app/shared/constants/local-storage.constants';
import {TerminalSettings} from 'src/app/shared/models/terminal-settings/terminal-settings.model';
import {GlobalLoadingIndicatorService} from 'src/app/shared/services/global-loading-indicator.service';
import {LocalStorageService} from 'src/app/shared/services/local-storage.service';
import {TerminalSettingsService} from 'src/app/shared/services/terminal-settings.service';
import {GuidGenerator} from 'src/app/shared/utils/guid';
import {DashboardsInternalActions} from 'src/app/store/dashboards/dashboards-actions';
import {
  TerminalSettingsEventsActions,
  TerminalSettingsInternalActions,
  TerminalSettingsServicesActions
} from 'src/app/store/terminal-settings/terminal-settings.actions';
import {WidgetSettingsInternalActions} from 'src/app/store/widget-settings/widget-settings.actions';
import {WidgetsLocalStateInternalActions} from "../../../store/widgets-local-state/widgets-local-state.actions";

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsBrokerService {
  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
    private readonly localStorageService: LocalStorageService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly globalLoadingIndicatorService: GlobalLoadingIndicatorService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  initSettingsBrokers(): void {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();

    this.store.dispatch(WidgetsLocalStateInternalActions.init({storageKey: LocalStorageAdminConstants.WidgetsLocalStateStorageKey}));
  }

  private initWidgetSettingsBroker(): void {
    /*
    const saveSettings = (settings: WidgetSettings[]): void => {
      this.localStorageService.setItem(LocalStorageAdminConstants.WidgetsSettingsStorageKey, settings.map(s => [s.guid, s]));
    };

    this.addActionSubscription(
      WidgetSettingsEventsActions.updated,
      action => {
        saveSettings(action.settings);
      }
    );
*/
    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    /*
    const savedItems = this.localStorageService.getItem<[string, WidgetSettings][]>(LocalStorageAdminConstants.WidgetsSettingsStorageKey) ?? [];
    const settings = savedItems.map(x => x[1]);

    this.store.dispatch(WidgetSettingsInternalActions.init({ settings }));
    */

    this.store.dispatch(WidgetSettingsInternalActions.init({settings: []}));
    this.globalLoadingIndicatorService.releaseLoading(loadingId);
  }

  private initDashboardSettingsBroker(): void {
    /*
    const saveDashboard = (settings: Dashboard[]): void => this.localStorageService.setItem(LocalStorageAdminConstants.DashboardsSettingsStorageKey, settings);

    this.addActionSubscription(
      DashboardsEventsActions.updated,
      action => {
        saveDashboard(action.dashboards);
      }
    );
*/
    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    // const dashboards = this.localStorageService.getItem<Dashboard[]>(LocalStorageAdminConstants.DashboardsSettingsStorageKey) ?? null;

    // this.store.dispatch(DashboardsInternalActions.init({ dashboards: dashboards ?? []}));
    this.store.dispatch(DashboardsInternalActions.init({dashboards: []}));
    this.globalLoadingIndicatorService.releaseLoading(loadingId);
  }

  private initTerminalSettingsBroker(): void {
    const saveSettings = (settings: TerminalSettings): void => this.localStorageService.setItem(LocalStorageAdminConstants.TerminalSettingsStorageKey, settings);

    this.addActionSubscription(
      TerminalSettingsServicesActions.update,
      () => {
        this.terminalSettingsService.getSettings(true).pipe(
          take(1),
        ).subscribe(settings => {
          saveSettings(settings);
          this.store.dispatch(TerminalSettingsEventsActions.saveSuccess());
        });
      }
    );

    this.addActionSubscription(
      TerminalSettingsServicesActions.reset,
      () => {
        this.localStorageService.removeItem(LocalStorageAdminConstants.TerminalSettingsStorageKey);
        this.localStorageService.removeItem(LocalStorageAdminConstants.WidgetsSettingsStorageKey);
        this.localStorageService.removeItem(LocalStorageAdminConstants.DashboardsSettingsStorageKey);

        this.store.dispatch(TerminalSettingsEventsActions.resetSuccess());
      }
    );

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const terminalSettings = this.localStorageService.getItem<TerminalSettings>(LocalStorageAdminConstants.TerminalSettingsStorageKey) ?? null;

    if (!terminalSettings) {
      this.store.dispatch(TerminalSettingsInternalActions.init({settings: null}));
      this.globalLoadingIndicatorService.releaseLoading(loadingId);
      return;
    }

    this.store.dispatch(TerminalSettingsInternalActions.init({settings: terminalSettings}));
    this.globalLoadingIndicatorService.releaseLoading(loadingId);
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
