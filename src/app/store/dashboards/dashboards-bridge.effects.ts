import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import { map } from 'rxjs/operators';
import {
  removeAllWidgetSettings,
  removeWidgetSettings
} from '../widget-settings/widget-settings.actions';
import { ManageDashboardsActions } from './dashboards-actions';

@Injectable()
export class DashboardsBridgeEffects {
  removeSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeWidgets),
      map(action => removeWidgetSettings({ settingGuids: action.widgetIds }))
    );
  });

  removeAllSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeAllDashboards),
      map(() => removeAllWidgetSettings())
    );
  });

  constructor(private readonly actions$: Actions) {
  }
}
