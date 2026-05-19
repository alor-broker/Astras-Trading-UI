import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {map} from 'rxjs';
import {TerminalSettingsInternalActions} from './actions';
import {TerminalSettingsHelper} from '../utils/terminal-settings.helper';

@Injectable()
export class TerminalSettingsEffects {
  private readonly actions$ = inject(Actions);

  initSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsInternalActions.init),
      map(action => {
        const defaultSettings = TerminalSettingsHelper.getDefaultSettings();
        return TerminalSettingsInternalActions.initSuccess({
            settings: {
              ...defaultSettings,
              ...action.settings,
              hotKeysSettings: {
                ...defaultSettings.hotKeysSettings,
                ...action.settings?.hotKeysSettings
              },
              scalperOrderBookMouseActions: {
                ...defaultSettings.scalperOrderBookMouseActions!,
                ...action.settings?.scalperOrderBookMouseActions
              },
              instantNotificationsSettings: {
                ...defaultSettings.instantNotificationsSettings!,
                ...action.settings?.instantNotificationsSettings
              }
            }
          }
        );
      })
    );
  });
}
