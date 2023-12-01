import { Injectable } from '@angular/core';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType
} from '@ngrx/effects';
import { map } from "rxjs/operators";
import { WidgetSettingsStreams } from "./widget-settings.streams";
import { Store } from "@ngrx/store";
import {
  WidgetSettingsEventsActions,
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from "./widget-settings.actions";

@Injectable()
export class WidgetSettingsEffects {
  settingsUpdated$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        WidgetSettingsServiceActions.add,
        WidgetSettingsServiceActions.updateContent,
        WidgetSettingsServiceActions.updateInstrument,
        WidgetSettingsServiceActions.updatePortfolio,
        WidgetSettingsServiceActions.remove,
        WidgetSettingsServiceActions.removeAll,
        WidgetSettingsInternalActions.setDefaultBadges
      ),
      concatLatestFrom(() => WidgetSettingsStreams.getAllSettings(this.store)),
      map(([, settings]) => WidgetSettingsEventsActions.updated({ settings }))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store) {
  }
}
