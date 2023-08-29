import {Injectable} from '@angular/core';
import {Actions, concatLatestFrom, createEffect, ofType} from '@ngrx/effects';
import {map} from "rxjs/operators";
import * as WidgetSettingsActions from './widget-settings.actions';
import {WidgetSettingsStreams} from "./widget-settings.streams";
import {Store} from "@ngrx/store";

@Injectable()
export class WidgetSettingsEffects {
  settingsUpdated = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        WidgetSettingsActions.addWidgetSettings,
        WidgetSettingsActions.updateWidgetSettings,
        WidgetSettingsActions.updateWidgetSettingsInstrument,
        WidgetSettingsActions.updateWidgetSettingsPortfolio,
        WidgetSettingsActions.removeWidgetSettings,
        WidgetSettingsActions.removeAllWidgetSettings,
        WidgetSettingsActions.setDefaultBadges
      ),
      concatLatestFrom(() => WidgetSettingsStreams.getAllSettings(this.store)),
      map(([, settings]) => WidgetSettingsActions.settingsUpdated({settings}))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store) {
  }
}
