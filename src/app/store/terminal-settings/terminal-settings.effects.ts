import { Injectable } from '@angular/core';
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
  initSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsInternalActions.init),
      map(action => {
        return TerminalSettingsInternalActions.initSuccess({
            settings: {
              ...TerminalSettingsHelper.getDefaultSettings(),
              ...action.settings
            }
          }
        );
      })
    );
  });

  constructor(private readonly actions$: Actions) {
  }
}
