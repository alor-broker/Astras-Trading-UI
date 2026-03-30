import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';

import { map } from 'rxjs/operators';
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { WidgetStateRecord } from "./widgets-local-state.model";
import { Store } from "@ngrx/store";
import { WidgetsLocalStatesFeature } from "./widgets-local-state.reducer";
import { tap } from "rxjs";
import {
  WidgetsLocalStateInternalActions,
  WidgetsLocalStateServicesActions
} from "./widgets-local-state.actions";

@Injectable()
export class WidgetsLocalStateEffects {
  private readonly actions$ = inject(Actions);
  private readonly localStorageService = inject(LocalStorageService);
  private readonly store = inject(Store);

  loadRecords$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WidgetsLocalStateInternalActions.init),
      map(action => {
        const savedRecords = this.localStorageService.getItem<WidgetStateRecord[]>(action.storageKey) ?? [];
        return WidgetsLocalStateInternalActions.load({ records: savedRecords });
      })
    );
  });

  recordsUpdated$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(
          WidgetsLocalStateServicesActions.setRecord,
          WidgetsLocalStateInternalActions.removeForWidgets
        ),
        concatLatestFrom(() => this.store.select(WidgetsLocalStatesFeature.selectWidgetsLocalStatesState)),
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
