import { DestroyRef, Injectable, inject } from '@angular/core';
import { DashboardSettingsBrokerService } from "../../../shared/services/settings-broker/dashboard-settings-broker.service";
import { WidgetsSettingsBrokerService } from "../../../shared/services/settings-broker/widgets-settings-broker.service";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import {
  combineLatest,
  take
} from "rxjs";
import {
  Actions,
  ofType
} from "@ngrx/effects";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  ActionCreator,
  Store
} from '@ngrx/store';
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { mergeArrays } from "../../../shared/utils/collections";
import { TerminalSettingsBrokerService } from "../../../shared/services/settings-broker/terminal-settings-broker.service";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import {
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from "../../../store/widget-settings/widget-settings.actions";
import {
  DashboardsEventsActions,
  DashboardsInternalActions
} from "../../../store/dashboards/dashboards-actions";
import {
  TerminalSettingsEventsActions,
  TerminalSettingsInternalActions,
  TerminalSettingsServicesActions
} from "../../../store/terminal-settings/terminal-settings.actions";
import { WidgetsLocalStateInternalActions } from "../../../store/widgets-local-state/widgets-local-state.actions";
import { GlobalLoadingIndicatorService } from "../../../shared/services/global-loading-indicator.service";
import { GuidGenerator } from "../../../shared/utils/guid";
import {
  ClientDashboardType,
  DefaultDesktopDashboardConfig
} from "../../../shared/models/dashboard/dashboard.model";

export interface InitSettingsBrokersOptions {
  onSettingsReadError: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class DesktopSettingsBrokerService {
  private readonly store = inject(Store);
  private readonly actions$ = inject(Actions);
  private readonly dashboardSettingsBrokerService = inject(DashboardSettingsBrokerService);
  private readonly manageDashboardsService = inject(ManageDashboardsService);
  private readonly widgetsSettingsBrokerService = inject(WidgetsSettingsBrokerService);
  private readonly widgetSettingsService = inject(WidgetSettingsService);
  private readonly terminalSettingsBrokerService = inject(TerminalSettingsBrokerService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);
  private readonly globalLoadingIndicatorService = inject(GlobalLoadingIndicatorService);
  private readonly destroyRef = inject(DestroyRef);

  initSettingsBrokers(options: InitSettingsBrokersOptions): void {
    this.initTerminalSettingsBroker(options);
    this.initWidgetSettingsBroker(options);
    this.initDashboardSettingsBroker(options);

    this.checkDirtyWidgetSettings();
  }

  private initDashboardSettingsBroker(options: InitSettingsBrokersOptions): void {
    this.addActionSubscription(
      DashboardsEventsActions.updated,
      action => {
        this.dashboardSettingsBrokerService.saveSettings(action.dashboards).subscribe();
      }
    );

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    this.dashboardSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(dashboards => {
      if (dashboards == null) {
        options.onSettingsReadError();
      } else {
        if (dashboards.settings.length > 0) {
          this.store.dispatch(DashboardsInternalActions.init({dashboards: dashboards.settings}));
          this.globalLoadingIndicatorService.releaseLoading(loadingId);
        } else {
          this.manageDashboardsService.getDashboardTemplatesConfig().pipe(
            take(1)
          ).subscribe(config => {
            this.store.dispatch(DashboardsInternalActions.init({dashboards: []}));

            const defaultDashboardsConfig = config
              .filter(d => d.type === ClientDashboardType.ClientDesktop)
              .map(d => d as DefaultDesktopDashboardConfig);

            defaultDashboardsConfig.forEach((d, index) => {
              this.manageDashboardsService.addDashboardWithTemplate({
                templateId: d.id,
                title: d.name ?? 'Dashboard',
                isSelected: index === 0,
                items: d.widgets.map(w => ({
                  guid: GuidGenerator.newGuid(),
                  widgetType: w.widgetTypeId,
                  position: w.position,
                  initialSettings: w.initialSettings
                })),
                isFavorite: d.isFavorite,
                type: d.type
              });
            });

            this.globalLoadingIndicatorService.releaseLoading(loadingId);
          });
        }
      }
    });
  }

  private initWidgetSettingsBroker(options: InitSettingsBrokersOptions): void {
    this.addActionSubscription(
      WidgetSettingsServiceActions.remove,
      action => this.widgetsSettingsBrokerService.removeSettings(action.settingGuids).subscribe()
    );

    this.addActionSubscription(
      WidgetSettingsServiceActions.add,
      action => this.saveWidgetSettings(action.settings.map(s => s.guid))
    );

    this.addActionSubscription(
      WidgetSettingsServiceActions.updateContent,
      action => this.saveWidgetSettings([action.settingGuid])
    );

    this.addActionSubscription(
      WidgetSettingsServiceActions.updateInstrument,
      action => this.saveWidgetSettings(action.updates.map(s => s.guid))
    );

    this.addActionSubscription(
      WidgetSettingsServiceActions.updatePortfolio,
      action => this.saveWidgetSettings(action.settingGuids)
    );

    this.addActionSubscription(
      WidgetSettingsInternalActions.setDefaultBadges,
      action => this.saveWidgetSettings(action.settingGuids)
    );

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    this.widgetsSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(settings => {
      if (settings == null) {
        options.onSettingsReadError();
      } else {
        this.store.dispatch(WidgetSettingsInternalActions.init({settings: settings}));
      }

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    });
  }

  private initTerminalSettingsBroker(options: InitSettingsBrokersOptions): void {
    this.addActionSubscription(
      TerminalSettingsServicesActions.update,
      () => {
        this.terminalSettingsService.getSettings(true).pipe(
          take(1),
        ).subscribe(settings => {
          this.terminalSettingsBrokerService.saveSettings(settings).pipe(
            take(1)
          ).subscribe(() => this.store.dispatch(TerminalSettingsEventsActions.saveSuccess()));
        });
      }
    );

    this.addActionSubscription(
      TerminalSettingsServicesActions.reset,
      () => {
        this.terminalSettingsBrokerService.removeSettings().pipe(
          take(1)
        ).subscribe(() => {
          this.store.dispatch(TerminalSettingsEventsActions.resetSuccess());
        });
      }
    );

    const loadingId = GuidGenerator.newGuid();
    this.globalLoadingIndicatorService.registerLoading(loadingId);

    this.terminalSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(settings => {
      if (settings == null) {
        options.onSettingsReadError();
      } else {
        this.store.dispatch(TerminalSettingsInternalActions.init({settings: settings.settings}));
      }

      this.globalLoadingIndicatorService.releaseLoading(loadingId);
    });
  }

  private checkDirtyWidgetSettings(): void {
    combineLatest([
      this.manageDashboardsService.allDashboards$,
      this.widgetSettingsService.getAllSettings()
    ]).pipe(
      take(1)
    ).subscribe(([allDashboards, allSettings]) => {
      if (allDashboards.length === 0 || allSettings.length === 0) {
        return;
      }

      const allWidgets = new Set(mergeArrays(allDashboards.map(d => d.items)).map(w => w.guid));

      const dirtySettings = allSettings
        .filter(s => !allWidgets.has(s.guid))
        .map(s => s.guid);

      if (dirtySettings.length === 0) {
        return;
      }

      this.widgetsSettingsBrokerService.removeSettings(dirtySettings).subscribe();
      this.store.dispatch(WidgetsLocalStateInternalActions.removeForWidgets({widgetsGuids: dirtySettings}));
    });
  }

  private addActionSubscription<AC extends ActionCreator, U = ReturnType<AC>>(actionCreator: AC, callback: (action: U) => void): void {
    this.actions$.pipe(
      ofType(actionCreator),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(action => {
      callback(<U>action);
    });
  }

  private saveWidgetSettings(widgetGuids: string[]): void {
    this.widgetSettingsService.getAllSettings().pipe(
      take(1)
    ).subscribe(allSettings => {
      const guids = new Set(widgetGuids);
      const updatedSettings = allSettings.filter(s => guids.has(s.guid));

      this.widgetsSettingsBrokerService.saveSettings(updatedSettings).subscribe();
    });
  }
}
