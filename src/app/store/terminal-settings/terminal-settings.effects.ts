import { Injectable } from '@angular/core';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType
} from '@ngrx/effects';

import * as TerminalSettingsActions from './terminal-settings.actions';
import { initTerminalSettingsSuccess } from './terminal-settings.actions';
import { HotKeysSettings, TerminalSettings } from '../../shared/models/terminal-settings/terminal-settings.model';
import { TimezoneDisplayOption } from '../../shared/models/enums/timezone-display-option';
import {
  map,
  tap
} from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { selectTerminalSettingsState } from './terminal-settings.selectors';
import { filter, take } from 'rxjs';
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { getAllSettings } from "../widget-settings/widget-settings.selectors";
import { mapWith } from "../../shared/utils/observable-helper";
import { updateWidgetSettings } from "../widget-settings/widget-settings.actions";

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
        tap(settings => this.saveSettingsToLocalStorage(settings)),
        mapWith(
          () => this.store.select(getAllSettings)
            .pipe(
              take(1),
              map(ws => ws.filter(s => !!s.badgeColor))
            ),
          (ts, ws) => ({ ts, ws })
          ),
        tap(({ts, ws}) => {
          if (!ts.badgesBind) {
            ws.forEach(
              s => this.store.dispatch(updateWidgetSettings({
                settingGuid: s.guid,
                changes: {badgeColor: 'yellow'}
              }))
            );
          }
        })
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
      userIdleDurationMin: 15,
      badgesBind: false,
      hotKeysSettings: this.getDefaultHotkeys(),
    } as TerminalSettings;
  }

  private getDefaultHotkeys(): HotKeysSettings {
    return {
      cancelOrdersKey: '~',
      closePositionsKey: 'Escape',
      centerOrderbookKey: ' ',
      cancelOrderbookOrders: 'E',
      closeOrderbookPositions: 'R',
      reverseOrderbookPositions: 'T',
      buyMarket: 'S',
      sellMarket: 'A',
      workingVolumes: ['1', '2', '3', '4'],
      sellBestOrder: 'W',
      buyBestOrder: 'Q',
    };
  }
}
