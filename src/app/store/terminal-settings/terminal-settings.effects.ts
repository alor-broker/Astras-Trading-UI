import { Injectable, inject } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';

import { map } from 'rxjs/operators';
import { TerminalSettingsHelper } from '../../shared/utils/terminal-settings-helper';
import { TerminalSettingsInternalActions } from "./terminal-settings.actions";

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
