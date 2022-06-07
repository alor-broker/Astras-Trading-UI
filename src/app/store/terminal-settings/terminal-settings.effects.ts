import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';

import * as TerminalSettingsActions from './terminal-settings.actions';
import { initTerminalSettingsSuccess } from './terminal-settings.actions';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../shared/models/enums/timezone-display-option';
import { map, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { selectTerminalSettingsState } from './terminal-settings.selectors';
import { filter } from 'rxjs';

@Injectable()
export class TerminalSettingsEffects {
  initSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsActions.initTerminalSettings),
      map(() => {
        const settings = this.readSettingsFromLocalStorage();

        return initTerminalSettingsSuccess({
            settings: {
              ...this.getDefaultSettings(),
              ...settings
            }
          }
        );
      })
    );
  });

  updateSettings$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(TerminalSettingsActions.updateTerminalSettings),
        concatLatestFrom(() => this.store.select(selectTerminalSettingsState)),
        map(([, settings]) => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings),
        tap(settings => this.saveSettingsToLocalStorage(settings))
      );
    },
    {
      dispatch: false
    });

  private readonly settingsStorageKey = 'terminalSettings';

  constructor(private readonly actions$: Actions, private readonly store: Store) {
  }

  private readSettingsFromLocalStorage(): TerminalSettings | null {
    // TODO: replace in https://github.com/alor-broker/Astras-Trading-UI/issues/152
    const json = localStorage.getItem(this.settingsStorageKey);
    if (!!json) {
      return JSON.parse(json) as TerminalSettings;
    }

    return null;
  }

  private saveSettingsToLocalStorage(settings: TerminalSettings) {
    // TODO: replace in https://github.com/alor-broker/Astras-Trading-UI/issues/152
    localStorage.setItem(this.settingsStorageKey, JSON.stringify(settings));
  }

  private getDefaultSettings(): TerminalSettings {
    return {
      timezoneDisplayOption: TimezoneDisplayOption.MskTime
    } as TerminalSettings;
  }
}
