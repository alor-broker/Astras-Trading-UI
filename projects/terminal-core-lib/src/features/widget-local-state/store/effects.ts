import {
  inject,
  Injectable
} from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import {LocalStorageService} from '../../local-storage/local-storage.service';
import {Store} from '@ngrx/store';
import {
  WidgetsLocalStateInternalActions,
  WidgetsLocalStateServicesActions
} from './actions';
import {
  map,
  tap
} from 'rxjs';
import {WidgetStateRecord} from '../widget-local-state.types';
import {concatLatestFrom} from '@ngrx/operators';
import {WidgetsLocalStatesFeature} from './reducer';

@Injectable()
export class WidgetsLocalStateEffects {
  private readonly actions$ = inject(Actions);

  private readonly localStorageService = inject(LocalStorageService);

  loadRecords$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WidgetsLocalStateInternalActions.init),
      map(action => {
        const savedRecords = this.localStorageService.getItem<WidgetStateRecord[]>(action.storageKey) ?? [];
        return WidgetsLocalStateInternalActions.load({records: savedRecords});
      })
    );
  });

  private readonly store = inject(Store);

  recordsUpdated$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(
          WidgetsLocalStateServicesActions.setRecord,
          WidgetsLocalStateInternalActions.clearForWidgets
        ),
        concatLatestFrom(() => this.store.select(WidgetsLocalStatesFeature.selectWidgetLocalStateState)),
        tap(([, state]) => {
          const recordsToSave = state.ids.map(id => state.entities[id])
            .filter(r => r!.restorable);

          this.localStorageService.setItem(state.storageKey, recordsToSave);
        })
      );
    },
    {
      dispatch: false
    });
}
