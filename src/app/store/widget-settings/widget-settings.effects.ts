import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {
  map,
  tap
} from "rxjs/operators";
import * as WidgetSettingsActions from './widget-settings.actions';
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { Store } from "@ngrx/store";
import { WidgetSettings } from '../../shared/models/widget-settings.model';

@Injectable()
export class WidgetSettingsEffects {
  createSave$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        WidgetSettingsActions.addWidgetSettings,
        WidgetSettingsActions.updateWidgetSettings,
        WidgetSettingsActions.updateWidgetSettingsInstrument,
        WidgetSettingsActions.updateWidgetSettingsPortfolio,
        WidgetSettingsActions.removeWidgetSettings,
        WidgetSettingsActions.removeAllWidgetSettings
      ),
      map(() => WidgetSettingsActions.saveSettings())
    );
  });

  private readonly settingsStorageKey = 'settings';

  constructor(
    private readonly actions$: Actions,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store) {
  }

  private readSettingsFromLocalStorage(): WidgetSettings[] | undefined {
    const settingItems = this.localStorage.getItem<[string, WidgetSettings][]>(this.settingsStorageKey);
    if (!settingItems) {
      return undefined;
    }

    return settingItems.map(x => x[1]);
  }

  private saveSettingsToLocalStorage(settings: WidgetSettings[]) {
    this.localStorage.setItem(this.settingsStorageKey, settings.map(s => [s.guid, s]));
  }

}
