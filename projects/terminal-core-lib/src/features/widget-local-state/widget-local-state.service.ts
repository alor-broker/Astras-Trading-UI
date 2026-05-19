import {
  inject,
  Injectable
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  filter,
  map,
  Observable,
  shareReplay
} from 'rxjs';
import {RecordContent} from "./widget-local-state.types";
import {
  getRecordId,
  State,
  WidgetsLocalStatesFeature
} from "./store/reducer";
import {
  WidgetsLocalStateInternalActions,
  WidgetsLocalStateServicesActions
} from "./store/actions";
import {EntityStatus} from "../../common/types/entity-status.types";

@Injectable()
export class WidgetLocalStateService {
  private readonly store = inject(Store);

  getStateRecord<T extends RecordContent>(
    widgetGuid: string,
    recordKey: string
  ): Observable<T | null> {
    return this.getState().pipe(
      map(s => (s.entities[getRecordId({widgetGuid, recordKey})]?.content as (T | undefined)) ?? null),
      shareReplay({bufferSize: 1, refCount: true})
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

  clearForWidgets(widgetsGuids: string[]): void {
    this.store.dispatch(WidgetsLocalStateInternalActions.clearForWidgets({widgetsGuids}));
  }

  init(config: { storageKey: string }): void {
    this.store.dispatch(WidgetsLocalStateInternalActions.init(config));
  }

  private getState(): Observable<State> {
    return this.store.select(WidgetsLocalStatesFeature.selectWidgetLocalStateState).pipe(
      filter(state => state.status === EntityStatus.Success),
    );
  }
}
