import { Injectable } from '@angular/core';
import { Actions, concatLatestFrom, createEffect, ofType } from '@ngrx/effects';
import { filter, map } from "rxjs/operators";
import { WidgetSettingsStreams } from "./widget-settings.streams";
import { Store } from "@ngrx/store";
import { instrumentsBadges } from "../../shared/utils/instruments";
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
      map(([, settings]) => WidgetSettingsEventsActions.updated({settings}))
    );
  });

  setBadgesColors$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        WidgetSettingsInternalActions.init
      ),
      map(a => a.settings.filter(s => !instrumentsBadges.includes(s.badgeColor ?? ''))),
      filter(settings => !!settings.length),
      map(settings => WidgetSettingsInternalActions.setDefaultBadges({ settingGuids: settings.map(s => s.guid) }))
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store) {
  }
}
