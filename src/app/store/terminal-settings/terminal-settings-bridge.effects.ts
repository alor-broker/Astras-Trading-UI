import {Injectable} from "@angular/core";
import {Actions, createEffect, ofType} from "@ngrx/effects";
import {ManageDashboardsActions} from "../dashboards/dashboards-actions";
import {map} from "rxjs/operators";
import {ApplicationMetaService} from "../../shared/services/application-meta.service";
import {TerminalSettingsActions} from "./terminal-settings.actions";
import {tap} from "rxjs";
import {LocalStorageService} from "../../shared/services/local-storage.service";

@Injectable()
export class TerminalSettingsBridgeEffects {
  reset$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsActions.reset),
      tap(() => {
        this.applicationMetaService.updateLastReset();

        this.localStorageService.removeItem('profile');
        this.localStorageService.removeItem('feedback');
      }),
      map(() => ManageDashboardsActions.removeAllDashboards())
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly localStorageService: LocalStorageService) {
  }
}
