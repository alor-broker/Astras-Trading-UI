import { DestroyRef, Injectable, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Actions,
  ofType
} from '@ngrx/effects';
import {
  ActionCreator,
  Store
} from '@ngrx/store';
import {
  asyncScheduler,
  subscribeOn,
  take
} from 'rxjs';
import { LocalStorageAdminConstants } from 'src/app/shared/constants/local-storage.constants';
import {
  OrdersInstantNotificationType,
  TerminalSettings
} from 'src/app/shared/models/terminal-settings/terminal-settings.model';
import { GlobalLoadingIndicatorService } from 'src/app/shared/services/global-loading-indicator.service';
import { LocalStorageService } from 'src/app/shared/services/local-storage.service';
import { TerminalSettingsService } from 'src/app/shared/services/terminal-settings.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import {
  DashboardsEventsActions,
  DashboardsInternalActions
} from 'src/app/store/dashboards/dashboards-actions';
import {
  TerminalSettingsEventsActions,
  TerminalSettingsInternalActions,
  TerminalSettingsServicesActions
} from 'src/app/store/terminal-settings/terminal-settings.actions';
import {
  WidgetSettingsEventsActions,
  WidgetSettingsInternalActions
} from 'src/app/store/widget-settings/widget-settings.actions';
import { WidgetsLocalStateInternalActions } from "../../../store/widgets-local-state/widgets-local-state.actions";
import {
  AdminDashboardType,
  Dashboard,
  DefaultDesktopDashboardConfig
} from "../../../shared/models/dashboard/dashboard.model";
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { WidgetSettings } from "../../../shared/models/widget-settings.model";

@Injectable({
  providedIn: 'root'
})
export class AdminSettingsBrokerService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);
  private readonly destroyRef = inject(DestroyRef);

  initSettingsBrokers(): void {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();

    this.store.dispatch(WidgetsLocalStateInternalActions.init({storageKey: LocalStorageAdminConstants.WidgetsLocalStateStorageKey}));
  }

  private initWidgetSettingsBroker(): void {
    const saveSettings = (settings: WidgetSettings[]): void => {
      this.localStorageService.setItem(LocalStorageAdminConstants.WidgetsSettingsStorageKey, settings.map(s => [s.guid, s]));
    };

    this.addActionSubscription(
      WidgetSettingsEventsActions.updated,
      action => {
        this.manageDashboardsService.allDashboards$.pipe(
          take(1),
          subscribeOn(asyncScheduler)
        ).subscribe(allDashboards => {
          const mainDashboard = allDashboards.find(d => d.type === AdminDashboardType.AdminMain);
          if(mainDashboard == null) {
            return;
          }

          const mainDashboardItems = new Set(mainDashboard.items.map(i => i.guid));

          saveSettings(action.settings.filter(s => mainDashboardItems.has(s.guid)));
        });
      }
    );

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const savedItems = this.localStorageService.getItem<[string, WidgetSettings][]>(LocalStorageAdminConstants.WidgetsSettingsStorageKey) ?? [];
    const settings = savedItems.map(x => x[1]);

    this.store.dispatch(WidgetSettingsInternalActions.init({ settings }));

    this.globalLoadingIndicatorService.releaseLoading(loadingId);
  }

  private initDashboardSettingsBroker(): void {
    const saveDashboard = (settings: Dashboard[]): void => this.localStorageService.setItem(LocalStorageAdminConstants.DashboardsSettingsStorageKey, settings);

    this.addActionSubscription(
      DashboardsEventsActions.updated,
      action => {
        saveDashboard(action.dashboards.filter(d => d.type === AdminDashboardType.AdminMain));
      }
    );

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    const dashboards = this.localStorageService.getItem<Dashboard[]>(LocalStorageAdminConstants.DashboardsSettingsStorageKey) ?? null;
    this.store.dispatch(DashboardsInternalActions.init({ dashboards: dashboards ?? []}));

    if((dashboards ?? []).length === 0) {
      this.manageDashboardsService.getDashboardTemplatesConfig().pipe(
        take(1)
      ).subscribe(config => {
        const defaultDashboardsConfig = config
          .filter(d => d.type === AdminDashboardType.AdminMain)
          .map(d => d as DefaultDesktopDashboardConfig);

        defaultDashboardsConfig.forEach((d) => {
          this.manageDashboardsService.addDashboardWithTemplate({
            title: "All Clients",
            isSelected: true,
            templateId: d.id,
            items: d.widgets.map(w => ({
              guid: GuidGenerator.newGuid(),
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings
            })),
            isFavorite: true,
            type: d.type
          });
        });

        this.globalLoadingIndicatorService.releaseLoading(loadingId);
      });
    } else {
      const adminDashboard = dashboards!.find(d => d.type === AdminDashboardType.AdminMain);

      if(adminDashboard != null) {
        this.manageDashboardsService.selectDashboard(adminDashboard.guid);
      }

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    }
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
      this.setDefaultSettings();
      this.globalLoadingIndicatorService.releaseLoading(loadingId);
      return;
    }

    this.store.dispatch(TerminalSettingsInternalActions.init({settings: terminalSettings}));
    this.setDefaultSettings();
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

  private setDefaultSettings(): void {
    this.store.dispatch(TerminalSettingsServicesActions.update({
      updates: {
        instantNotificationsSettings: {
          hiddenNotifications: [
            OrdersInstantNotificationType.OrderFilled,
            OrdersInstantNotificationType.OrderPartiallyFilled,
            OrdersInstantNotificationType.OrderStatusChanged,
            OrdersInstantNotificationType.OrderStatusChangeToCancelled
          ]
        }
      },
      freezeChanges: false
    }));
  }
}
