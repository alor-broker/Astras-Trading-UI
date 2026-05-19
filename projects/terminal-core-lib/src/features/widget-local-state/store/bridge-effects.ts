import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {TerminalSettingsServicesActions} from '../../terminal-settings/store/actions';
import {
  map,
  tap
} from 'rxjs';
import {LocalStorageCommonConstants} from '../../local-storage/local-storage.constants';
import {
  DashboardItemsActions,
  DashboardsManageActions
} from '../../dashboard/desktop/store/actions';
import {WidgetsLocalStateInternalActions} from './actions';

@Injectable()
export class WidgetsLocalStateBridgeEffects {
  private readonly actions$ = inject(Actions);

  widgetsRemoved$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardItemsActions.removeWidgets),
      map(action => WidgetsLocalStateInternalActions.clearForWidgets({widgetsGuids: action.widgetIds}))
    );
  });

  private readonly localStorageService = inject(LocalStorageService);

  reset$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsServicesActions.reset),
      tap(() => {
        this.localStorageService.removeItem(LocalStorageCommonConstants.WidgetsLocalStateStorageKey);
      }),
      map(() => DashboardsManageActions.removeAll())
    );
  });
}
