import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';

import {map} from 'rxjs/operators';
import {TerminalSettingsHelper} from '../../shared/utils/terminal-settings-helper';
import {InternalTerminalSettingsActions, TerminalSettingsActions} from "./terminal-settings.actions";

@Injectable()
export class TerminalSettingsEffects {
  initSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsActions.initTerminalSettings),
      map(action => {
        return InternalTerminalSettingsActions.initTerminalSettingsSuccess({
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
