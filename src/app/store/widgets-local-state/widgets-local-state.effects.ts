import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';

import { map } from 'rxjs/operators';
import { LocalStorageService } from "../../shared/services/local-storage.service";
import { WidgetStateRecord } from "./widgets-local-state.model";
import { LocalStorageCommonConstants } from "../../shared/constants/local-storage.constants";
import { Store } from "@ngrx/store";
import { WidgetsLocalStatesFeature } from "./widgets-local-state.reducer";
import { tap } from "rxjs";
import {
  WidgetsLocalStateInternalActions,
  WidgetsLocalStateServicesActions
} from "./widgets-local-state.actions";

@Injectable()
export class WidgetsLocalStateEffects {
  loadRecords$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(WidgetsLocalStateInternalActions.init),
      map(() => {
        const savedRecords = this.localStorageService.getItem<WidgetStateRecord[]>(LocalStorageCommonConstants.WidgetsLocalStateStorageKey) ?? [];
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
        concatLatestFrom(() => this.store.select(WidgetsLocalStatesFeature.selectAll)),
        tap(([, allRecords]) => {
          const recordsToSave = allRecords.filter(r => r.restorable);
          this.localStorageService.setItem(LocalStorageCommonConstants.WidgetsLocalStateStorageKey, recordsToSave);
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
