import { Injectable, inject } from '@angular/core';
import { RecordContent } from "../../store/widgets-local-state/widgets-local-state.model";
import {
  Observable,
  shareReplay
} from "rxjs";
import {
  getRecordId,
  State,
  WidgetsLocalStatesFeature
} from "../../store/widgets-local-state/widgets-local-state.reducer";
import { Store } from "@ngrx/store";
import {
  filter,
  map
} from "rxjs/operators";
import { EntityStatus } from "../models/enums/entity-status";
import { WidgetsLocalStateServicesActions } from "../../store/widgets-local-state/widgets-local-state.actions";

@Injectable({
  providedIn: 'root'
})
export class WidgetLocalStateService {
  private readonly store = inject(Store);

  getStateRecord<T extends RecordContent>(
    widgetGuid: string,
    recordKey: string
  ): Observable<T | null> {
    return this.getState().pipe(
      map(s => (s.entities[getRecordId({ widgetGuid, recordKey })]?.content as (T | undefined)) ?? null),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  setStateRecord<T extends RecordContent>(widgetGuid: string, recordKey: string, content: T, restorable = true): void {
    this.store.dispatch(WidgetsLocalStateServicesActions.setRecord({
      record: {
        widgetGuid,
        recordKey,
        content,
        restorable
      }
    }));
  }

  private getState(): Observable<State> {
    return this.store.select(WidgetsLocalStatesFeature.selectWidgetsLocalStatesState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
