import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {ApplicationMetaService} from '../../application-meta/application-meta.service';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {
  map,
  tap
} from 'rxjs';
import {TerminalSettingsServicesActions} from './actions';
import {
  DesignSettingsConstants,
  LocalStorageCommonConstants,
  LocalStorageDesktopConstants
} from '../../local-storage/local-storage.constants';
import {DashboardsManageActions} from '../../dashboard/desktop/store/actions';

@Injectable()
export class TerminalSettingsBridgeEffects {
  private readonly actions$ = inject(Actions);

  private readonly applicationMetaService = inject(ApplicationMetaService);

  private readonly localStorageService = inject(LocalStorageService);

  reset$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsServicesActions.reset),
      tap(() => {
        this.applicationMetaService.updateLastReset();

        this.localStorageService.removeItem(LocalStorageDesktopConstants.ProfileStorageKey);
        this.localStorageService.removeItem(LocalStorageCommonConstants.FeedbackStorageKey);
        this.localStorageService.removeItem(LocalStorageCommonConstants.AIGraphsStorageKey);
        this.localStorageService.removeItem(DesignSettingsConstants.LastThemeStorageKey);
        this.localStorageService.removeItem(DesignSettingsConstants.LastFontStorageKey);
      }),
      map(() => DashboardsManageActions.removeAll())
    );
  });
}
