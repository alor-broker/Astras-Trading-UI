import { Injectable } from '@angular/core';
import {
  Actions,
  concatLatestFrom,
  createEffect,
  ofType
} from '@ngrx/effects';

import { map } from 'rxjs/operators';
import { WidgetsLocalStateActions } from './widgets-local-state.actions';
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { WidgetStateRecord } from "./widgets-local-state.model";
import { LocalStorageConstants } from "../../shared/constants/local-storage.constants";
import { Store } from "@ngrx/store";
import { widgetsLocalStatesFeature } from "./widgets-local-state.reducer";
import { tap } from "rxjs";

@Injectable()
export class WidgetsLocalStateEffects {
  loadRecords$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WidgetsLocalStateActions.init),
      map(() => {
        const savedRecords = this.localStorageService.getItem<WidgetStateRecord[]>(LocalStorageConstants.WidgetsLocalStateStorageKey) ?? [];
        return WidgetsLocalStateActions.load({ records: savedRecords });
      })
    );
  });

  recordsUpdated$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(
          WidgetsLocalStateActions.setRecord,
          WidgetsLocalStateActions.removeForWidgets
        ),
        concatLatestFrom(() => this.store.select(widgetsLocalStatesFeature.selectAll)),
        tap(([, allRecords]) => {
          const recordsToSave = allRecords.filter(r => r.restorable);
          this.localStorageService.setItem(LocalStorageConstants.WidgetsLocalStateStorageKey, recordsToSave);
        })
      );
    },
    {
      dispatch: false
    });

  constructor(
    private readonly actions$: Actions,
    private readonly localStorageService: LocalStorageService,
    private readonly store: Store
  ) {
  }
}
