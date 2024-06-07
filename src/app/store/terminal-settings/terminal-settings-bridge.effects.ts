import { Injectable } from "@angular/core";
import {
  Actions,
  createEffect,
  ofType
} from "@ngrx/effects";
import { map } from "rxjs/operators";
import { ApplicationMetaService } from "../../shared/services/application-meta.service";
import { tap } from "rxjs";
import { LocalStorageService } from "../../shared/services/local-storage.service";
import {
  DesignSettingsConstants,
  LocalStorageCommonConstants,
  LocalStorageDesktopConstants
} from "../../shared/constants/local-storage.constants";
import { DashboardsManageActions } from "../dashboards/dashboards-actions";
import { TerminalSettingsServicesActions } from "./terminal-settings.actions";

@Injectable()
export class TerminalSettingsBridgeEffects {
  reset$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsServicesActions.reset),
      tap(() => {
        this.applicationMetaService.updateLastReset();

        this.localStorageService.removeItem(LocalStorageDesktopConstants.ProfileStorageKey);
        this.localStorageService.removeItem(LocalStorageCommonConstants.FeedbackStorageKey);
        this.localStorageService.removeItem(DesignSettingsConstants.LastThemeStorageKey);
        this.localStorageService.removeItem(DesignSettingsConstants.LastFontStorageKey);
      }),
      map(() => DashboardsManageActions.removeAll())
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly applicationMetaService: ApplicationMetaService,
    private readonly localStorageService: LocalStorageService) {
  }
}
