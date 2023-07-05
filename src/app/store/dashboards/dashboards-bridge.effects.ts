import {Injectable} from '@angular/core';
import {Actions, concatLatestFrom, createEffect, ofType} from '@ngrx/effects';
import {map, switchMap} from 'rxjs/operators';
import {
  addWidgetSettings,
  removeAllWidgetSettings,
  removeWidgetSettings
} from '../widget-settings/widget-settings.actions';
import {ManageDashboardsActions} from './dashboards-actions';
import {Store} from "@ngrx/store";
import {allDashboards} from "./dashboards.selectors";
import {getAllSettings} from "../widget-settings/widget-settings.selectors";
import {EMPTY} from "rxjs";
import {Widget} from "../../shared/models/dashboard/widget.model";
import {WidgetSettings} from "../../shared/models/widget-settings.model";
import {GuidGenerator} from "../../shared/utils/guid";

@Injectable()
export class DashboardsBridgeEffects {
  removeSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeWidgets),
      map(action => removeWidgetSettings({settingGuids: action.widgetIds}))
    );
  });

  removeAllSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeAllDashboards),
      map(() => removeAllWidgetSettings())
    );
  });

  copyDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.copyDashboard),
      concatLatestFrom(() => this.store.select(allDashboards)),
      map(([action, allDashboards]) => ({
          action,
          allDashboards
        })
      ),
      concatLatestFrom(() => this.store.select(getAllSettings)),
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
          actions.push(addWidgetSettings({settings: settingsCopy}));
        }

        actions.push(ManageDashboardsActions.addDashboard({
          guid: GuidGenerator.newGuid(),
          sourceGuid: targetDashboard.guid,
          title: `${targetDashboard.title } ${params.allDashboards.filter(d => d.sourceGuid === targetDashboard.guid).length + 1}`,
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
