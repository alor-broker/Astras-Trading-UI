import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {Store} from "@ngrx/store";
import {concatLatestFrom,} from "@ngrx/operators"
import {
  WidgetSettingsEventsActions,
  WidgetSettingsInternalActions,
  WidgetSettingsServiceActions
} from './actions';
import {map} from 'rxjs';
import {WidgetSettingsStreams} from './streams';

@Injectable()
export class WidgetSettingsEffects {
  private readonly actions$ = inject(Actions);

  private readonly store = inject(Store);

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
}
