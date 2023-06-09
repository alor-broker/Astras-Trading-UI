import { Injectable } from '@angular/core';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType
} from '@ngrx/effects';

import * as TerminalSettingsActions from './terminal-settings.actions';
import { TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';
import {
  map,
  tap
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { selectTerminalSettingsState } from './terminal-settings.selectors';
import { filter } from 'rxjs';
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { TerminalSettingsHelper } from '../../shared/utils/terminal-settings-helper';
import {saveTerminalSettingsSuccess, initTerminalSettingsSuccess} from "./terminal-settings.actions";

@Injectable()
export class TerminalSettingsEffects {
  initSettings$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(TerminalSettingsActions.initTerminalSettings),
      map(() => {
        const savedSettings = this.readSettingsFromLocalStorage();

        return initTerminalSettingsSuccess({
            settings: {
              ...TerminalSettingsHelper.getDefaultSettings(),
              ...savedSettings
            }
          }
        );
      })
    );
  });

  saveSettings$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(TerminalSettingsActions.updateTerminalSettings),
        concatLatestFrom(() => this.store.select(selectTerminalSettingsState)),
        map(([, settings]) => settings.settings),
        filter((settings): settings is TerminalSettings => !!settings),
        tap(settings => this.saveSettingsToLocalStorage(settings)),
        map(() => saveTerminalSettingsSuccess())
      );
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
}
