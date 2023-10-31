import { Injectable } from '@angular/core';
import { RecordContent } from "../../store/widgets-local-state/widgets-local-state.model";
import {
  Observable,
  shareReplay
} from "rxjs";
import {
  getRecordId,
  State,
  widgetsLocalStatesFeature
} from "../../store/widgets-local-state/widgets-local-state.reducer";
import { Store } from "@ngrx/store";
import {
  filter,
  map
} from "rxjs/operators";
import { WidgetsLocalStateActions } from "../../store/widgets-local-state/widgets-local-state.actions";
import { EntityStatus } from "../models/enums/entity-status";

@Injectable({
  providedIn: 'root'
})
export class WidgetLocalStateService {

  constructor(private readonly store: Store) {
  }

  getStateRecord<T extends RecordContent>(
    widgetGuid: string,
    recordKey: string
  ): Observable<T | null> {
    return this.getState().pipe(
      map(s => (s.entities[getRecordId({ widgetGuid, recordKey })]?.content as T) ?? null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  setStateRecord<T extends RecordContent>(widgetGuid: string, recordKey: string, content: T, restorable = true) {
    this.store.dispatch(WidgetsLocalStateActions.setRecord({
      record: {
        widgetGuid,
        recordKey,
        content,
        restorable
      }
    }));
  }

  private getState(): Observable<State> {
    return this.store.select(widgetsLocalStatesFeature.selectWidgetsLocalStatesState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
