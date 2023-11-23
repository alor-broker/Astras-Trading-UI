import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { map } from 'rxjs/operators';
import { tap } from 'rxjs';
import { LocalStorageConstants } from "../../shared/constants/local-storage.constants";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import {
  DashboardItemsActions,
  DashboardsManageActions
} from "../dashboards/dashboards-actions";
import { TerminalSettingsServicesActions } from "../terminal-settings/terminal-settings.actions";
import { WidgetsLocalStateInternalActions } from "./widgets-local-state.actions";

@Injectable()
export class WidgetsLocalStateBridgeEffects {
  reset$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsServicesActions.reset),
      tap(() => {
        this.localStorageService.removeItem(LocalStorageConstants.WidgetsLocalStateStorageKey);
      }),
      map(() => DashboardsManageActions.removeAll())
    );
  });

  widgetsRemoved$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardItemsActions.removeWidgets),
      map(action => WidgetsLocalStateInternalActions.removeForWidgets({ widgetsGuids: action.widgetIds }))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly localStorageService: LocalStorageService) {
  }
}
