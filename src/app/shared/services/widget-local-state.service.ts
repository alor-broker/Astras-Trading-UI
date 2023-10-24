import { Injectable } from '@angular/core';
import {
  RecordContent,
  WidgetStateRecord
} from "../../store/widgets-local-state/widgets-local-state.model";
import {
  filter,
  Observable,
  shareReplay
} from "rxjs";
import {
  getRecordId,
  State,
  widgetsLocalStatesFeature
} from "../../store/widgets-local-state/widgets-local-state.reducer";
import { Store } from "@ngrx/store";
import { EntityStatus } from "../models/enums/entity-status";
import { map } from "rxjs/operators";
import { WidgetsLocalStateActions } from "../../store/widgets-local-state/widgets-local-state.actions";

@Injectable({
  providedIn: 'root'
})
export class WidgetLocalStateService {

  constructor(private readonly store: Store) {
  }

  getStateRecord<T extends WidgetStateRecord>(
    widgetGuid: string,
    recordKey: string
  ): Observable<T | null> {
    return this.getState().pipe(
      map(s => (s.entities[getRecordId({ widgetGuid, recordKey })]?.content as T) ?? null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  setStateRecord<T extends RecordContent>(widgetGuid: string, recordKey: string, content: T) {
    this.store.dispatch(WidgetsLocalStateActions.setWidgetLocalStateRecord({
      record: {
        widgetGuid,
        recordKey,
        content
      }
    }));
  }

  private getState(): Observable<State> {
    return this.store.select(widgetsLocalStatesFeature.selectWidgetsLocalStatesState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
