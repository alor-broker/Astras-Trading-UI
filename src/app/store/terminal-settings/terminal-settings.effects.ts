import { Injectable } from '@angular/core';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType
} from '@ngrx/effects';

import * as TerminalSettingsActions from './terminal-settings.actions';
import { initTerminalSettingsSuccess } from './terminal-settings.actions';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../shared/models/enums/timezone-display-option';
import {
  map,
  tap
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { selectTerminalSettingsState } from './terminal-settings.selectors';
import { filter } from 'rxjs';
import { LocalStorageService } from "../../shared/services/local-storage.service";

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

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly localStorage: LocalStorageService) {
  }

  private readSettingsFromLocalStorage(): TerminalSettings | undefined {
    return this.localStorage.getItem<TerminalSettings>(this.settingsStorageKey);
  }

  private saveSettingsToLocalStorage(settings: TerminalSettings) {
    this.localStorage.setItem(this.settingsStorageKey, settings);
  }

  private getDefaultSettings(): TerminalSettings {
    return {
      timezoneDisplayOption: TimezoneDisplayOption.MskTime,
      userIdleDurationMin: 15
    } as TerminalSettings;
  }
}
