import {DestroyRef, Injectable} from '@angular/core';
import {
  DashboardSettingsBrokerService
} from "../../../shared/services/settings-broker/dashboard-settings-broker.service";
import {WidgetsSettingsBrokerService} from "../../../shared/services/settings-broker/widgets-settings-broker.service";
import {WidgetSettingsService} from "../../../shared/services/widget-settings.service";
import {ManageDashboardsActions} from "../../../store/dashboards/dashboards-actions";
import {combineLatest, take} from "rxjs";
import * as WidgetSettingsActions from "../../../store/widget-settings/widget-settings.actions";
import {initWidgetSettings} from "../../../store/widget-settings/widget-settings.actions";
import {ActionCreator} from "@ngrx/store/src/models";
import {Actions, ofType} from "@ngrx/effects";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {Store} from "@ngrx/store";
import {ManageDashboardsService} from "../../../shared/services/manage-dashboards.service";
import {mergeArrays} from "../../../shared/utils/collections";

@Injectable({
  providedIn: 'root'
})
export class DesktopSettingsBrokerService {
  constructor(
    private readonly store: Store,
    private readonly destroyRef: DestroyRef,
    private readonly actions$: Actions,
    private readonly dashboardSettingsBrokerService: DashboardSettingsBrokerService,
    private readonly widgetsSettingsBrokerService: WidgetsSettingsBrokerService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly manageDashboardsService: ManageDashboardsService
  ) {
  }

  initSettingsBrokers() {
    this.initWidgetSettingsBroker();
    this.initDashboardSettingsBroker();
    this.checkDirtyWidgetSettings();
  }

  private initDashboardSettingsBroker() {
    this.addActionSubscription(
      ManageDashboardsActions.saveDashboards,
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

  private initWidgetSettingsBroker() {
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

  private addActionSubscription<AC extends ActionCreator, U = ReturnType<AC>>(actionCreator: AC, callback: (action: U) => void) {
    this.actions$.pipe(
      ofType(actionCreator),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(action => {
      callback(<U>action);
    });
  }

  private saveWidgetSettings(widgetGuids: string[]) {
    this.widgetSettingsService.getAllSettings().pipe(
      take(1)
    ).subscribe(allSettings => {
      const guids = new Set(widgetGuids);
      const updatedSettings = allSettings.filter(s => guids.has(s.guid));

      this.widgetsSettingsBrokerService.saveSettings(updatedSettings).subscribe();
    });
  }

  private checkDirtyWidgetSettings() {
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

      const dirtySettings = allSettings.filter(s => !allWidgets.has(s.guid))
        .map(s => s.guid);

      if (dirtySettings.length === 0) {
        return;
      }

      this.widgetsSettingsBrokerService.removeSettings(dirtySettings).subscribe();
    });
  }
}
