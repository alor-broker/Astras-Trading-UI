import {Injectable} from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';

import {map, switchMap} from 'rxjs/operators';
import {WidgetSettingsServiceActions} from '../widget-settings/widget-settings.actions';
import {Store} from "@ngrx/store";
import {EMPTY} from "rxjs";
import {Widget} from "../../shared/models/dashboard/widget.model";
import {WidgetSettings} from "../../shared/models/widget-settings.model";
import {GuidGenerator} from "../../shared/utils/guid";
import {WidgetSettingsStreams} from "../widget-settings/widget-settings.streams";
import {DashboardsStreams} from "./dashboards.streams";
import {
  DashboardItemsActions,
  DashboardsManageActions
} from "./dashboards-actions";

@Injectable()
export class DashboardsBridgeEffects {
  removeSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardItemsActions.removeWidgets),
      map(action => WidgetSettingsServiceActions.remove({settingGuids: action.widgetIds}))
    );
  });

  removeAllSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.removeAll),
      map(() => WidgetSettingsServiceActions.removeAll())
    );
  });

  copyDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.copy),
      concatLatestFrom(() => DashboardsStreams.getAllDashboards(this.store)),
      map(([action, allDashboards]) => ({
          action,
          allDashboards
        })
      ),
      concatLatestFrom(() => WidgetSettingsStreams.getAllSettings(this.store)),
      map(([source, widgetSettings]) => ({
          ...source,
          widgetSettings
        })
      ),
      switchMap(params => {
        const targetDashboard = params.allDashboards.find(d => d.guid === params.action.dashboardGuid);
        if (!targetDashboard) {
          return EMPTY;
        }

        const widgetsCopy: Widget[] = [];
        const settingsCopy: WidgetSettings[] = [];

        for (const widget of targetDashboard.items) {
          const newWidgetInstance = {
            ...widget,
            guid: GuidGenerator.newGuid()
          } as Widget;

          widgetsCopy.push(newWidgetInstance);

          const widgetSettings = params.widgetSettings.find(s => s.guid === widget.guid);
          if (widgetSettings) {
            const newSettings = {
              ...JSON.parse(JSON.stringify(widgetSettings)),
              guid: newWidgetInstance.guid
            } as WidgetSettings;

            settingsCopy.push(newSettings);
          }
        }

        const actions = [];
        if (settingsCopy.length > 0) {
          actions.push(WidgetSettingsServiceActions.add({settings: settingsCopy}));
        }

        actions.push(DashboardsManageActions.add({
          guid: GuidGenerator.newGuid(),
          sourceGuid: targetDashboard.guid,
          title: `${targetDashboard.title} ${params.allDashboards.filter(d => d.sourceGuid === targetDashboard.guid).length + 1}`,
          isSelected: true,
          existedItems: widgetsCopy,
          instrumentsSelection: {
            ...targetDashboard.instrumentsSelection
          }
        }));

        return actions;
      })
    );
  });

  constructor(
    private readonly store: Store,
    private readonly actions$: Actions) {
  }
}
