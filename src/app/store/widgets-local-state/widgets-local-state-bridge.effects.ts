import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { map } from 'rxjs/operators';
import { tap } from 'rxjs';
import { TerminalSettingsActions } from "../terminal-settings/terminal-settings.actions";
import { LocalStorageConstants } from "../../shared/constants/local-storage.constants";
import { ManageDashboardsActions } from "../dashboards/dashboards-actions";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { WidgetsLocalStateActions } from "./widgets-local-state.actions";

@Injectable()
export class WidgetsLocalStateBridgeEffects {
  reset$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsActions.reset),
      tap(() => {
        this.localStorageService.removeItem(LocalStorageConstants.WidgetsLocalStateStorageKey);
      }),
      map(() => ManageDashboardsActions.removeAllDashboards())
    );
  });

  widgetsRemoved$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeWidgets),
      map(action => WidgetsLocalStateActions.removeForWidgets({ widgetsGuids: action.widgetIds }))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly localStorageService: LocalStorageService) {
  }
}
