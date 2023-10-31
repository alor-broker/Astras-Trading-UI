import {
  createFeature,
  createReducer,
  on
} from '@ngrx/store';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from '@ngrx/entity';
import { WidgetStateRecord } from './widgets-local-state.model';
import { EntityStatus } from "../../shared/models/enums/entity-status";
import { WidgetsLocalStateActions } from "./widgets-local-state.actions";

export interface State extends EntityState<WidgetStateRecord> {
  status: EntityStatus
}

export const getRecordId = (record: { widgetGuid: string; recordKey: string; }) => {
  return `${record.widgetGuid}_${record.recordKey}`;
};

export const adapter: EntityAdapter<WidgetStateRecord> = createEntityAdapter<WidgetStateRecord>({
  selectId: model => getRecordId(model)
});

export const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});

export const reducer = createReducer(
  initialState,
  on(WidgetsLocalStateActions.setRecord,
    (state, action) => adapter.upsertOne(action.record, state)
  ),
  on(WidgetsLocalStateActions.init,
    (state) => ({
      ...state,
      status: EntityStatus.Loading
    })
  ),
  on(WidgetsLocalStateActions.load,
    (state, action) => ({
      ...adapter.addMany(action.records, state),
      status: EntityStatus.Success
    })
  ),
  on(WidgetsLocalStateActions.removeForWidgets,
    (state, action) => {

      const allRecords = adapter.getSelectors()
        .selectIds(state)
        .map((id) => ({
          id: <string>id,
          record: state.entities[id]!
        }));

      const recordIdsToRemove =
        allRecords.filter(r => action.widgetsGuids.includes(r.record.widgetGuid))
          .map(r => r.id);

      return adapter.removeMany(recordIdsToRemove, state);
    }
  ),
);

export const widgetsLocalStatesFeature = createFeature({
  name: 'widgetsLocalStates',
  reducer,
  extraSelectors: ({ selectWidgetsLocalStatesState }) => ({
    ...adapter.getSelectors(selectWidgetsLocalStatesState)
  }),
});
