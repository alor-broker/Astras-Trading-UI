import { DestroyRef, Injectable } from '@angular/core';
import {
  DashboardSettingsBrokerService
} from "../../../shared/services/settings-broker/dashboard-settings-broker.service";
import { WidgetsSettingsBrokerService } from "../../../shared/services/settings-broker/widgets-settings-broker.service";
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { ManageDashboardsActions } from "../../../store/dashboards/dashboards-actions";
import { combineLatest, take } from "rxjs";
import * as WidgetSettingsActions from "../../../store/widget-settings/widget-settings.actions";
import { initWidgetSettings } from "../../../store/widget-settings/widget-settings.actions";
import { ActionCreator } from "@ngrx/store/src/models";
import { Actions, ofType } from "@ngrx/effects";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { Store } from "@ngrx/store";
import { ManageDashboardsService } from "../../../shared/services/manage-dashboards.service";
import { mergeArrays } from "../../../shared/utils/collections";
import {
  TerminalSettingsBrokerService
} from "../../../shared/services/settings-broker/terminal-settings-broker.service";
import { TerminalSettingsActions } from "../../../store/terminal-settings/terminal-settings.actions";
import { TerminalSettingsService } from "../../../shared/services/terminal-settings.service";
import { WidgetsLocalStateActions } from "../../../store/widgets-local-state/widgets-local-state.actions";

@Injectable({
  providedIn: 'root'
})
export class DesktopSettingsBrokerService {
  constructor(
    private readonly store: Store,
    private readonly actions$: Actions,
    private readonly dashboardSettingsBrokerService: DashboardSettingsBrokerService,
    private readonly manageDashboardsService: ManageDashboardsService,
    private readonly widgetsSettingsBrokerService: WidgetsSettingsBrokerService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsBrokerService: TerminalSettingsBrokerService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly destroyRef: DestroyRef
  ) {
  }

  initSettingsBrokers(): void {
    this.initTerminalSettingsBroker();
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();

    this.checkDirtyWidgetSettings();
  }

  private initDashboardSettingsBroker(): void {
    this.addActionSubscription(
      ManageDashboardsActions.dashboardsUpdated,
      action => {
        this.dashboardSettingsBrokerService.saveSettings(action.dashboards).subscribe();
      }
    );

    this.dashboardSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(dashboards => {
      this.store.dispatch(ManageDashboardsActions.initDashboards({dashboards: dashboards ?? []}));
    });
  }

  private initWidgetSettingsBroker(): void {
    this.addActionSubscription(
      WidgetSettingsActions.removeWidgetSettings,
      action => this.widgetsSettingsBrokerService.removeSettings(action.settingGuids).subscribe()
    );

    this.addActionSubscription(
      WidgetSettingsActions.addWidgetSettings,
      action => this.saveWidgetSettings(action.settings.map(s => s.guid))
    );

    this.addActionSubscription(
      WidgetSettingsActions.updateWidgetSettings,
      action => this.saveWidgetSettings([action.settingGuid])
    );

    this.addActionSubscription(
      WidgetSettingsActions.updateWidgetSettingsInstrument,
      action => this.saveWidgetSettings(action.updates.map(s => s.guid))
    );

    this.addActionSubscription(
      WidgetSettingsActions.updateWidgetSettingsPortfolio,
      action => this.saveWidgetSettings(action.settingGuids)
    );

    this.addActionSubscription(
      WidgetSettingsActions.setDefaultBadges,
      action => this.saveWidgetSettings(action.settingGuids)
    );

    this.widgetsSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(settings => {
      this.store.dispatch(initWidgetSettings({settings: settings ?? []}));
    });
  }

  private initTerminalSettingsBroker(): void {
    this.addActionSubscription(
      TerminalSettingsActions.updateTerminalSettings,
      () => {
        this.terminalSettingsService.getSettings(true).pipe(
          take(1),
        ).subscribe(settings => {
          this.terminalSettingsBrokerService.saveSettings(settings).pipe(
            take(1)
          ).subscribe(() => this.store.dispatch(TerminalSettingsActions.saveTerminalSettingsSuccess()));
        });
      }
    );

    this.addActionSubscription(
      TerminalSettingsActions.reset,
      () => {
        this.terminalSettingsBrokerService.removeSettings().pipe(
          take(1)
        ).subscribe(() => {
          this.store.dispatch(TerminalSettingsActions.resetSuccess());
        });
      }
    );

    this.terminalSettingsBrokerService.readSettings().pipe(
      take(1)
    ).subscribe(settings => {
      this.store.dispatch(TerminalSettingsActions.initTerminalSettings({settings}));
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
      this.store.dispatch(WidgetsLocalStateActions.removeForWidgets({ widgetsGuids: dirtySettings }));
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
