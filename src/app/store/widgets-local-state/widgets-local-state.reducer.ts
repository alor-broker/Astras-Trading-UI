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
import {
  WidgetsLocalStateInternalActions,
  WidgetsLocalStateServicesActions
} from "./widgets-local-state.actions";

export interface State extends EntityState<WidgetStateRecord> {
  status: EntityStatus;
  storageKey: string;
}

export const getRecordId = (record: { widgetGuid: string, recordKey: string }): string => {
  return `${record.widgetGuid}_${record.recordKey}`;
};

export const adapter: EntityAdapter<WidgetStateRecord> = createEntityAdapter<WidgetStateRecord>({
  selectId: model => getRecordId(model)
});

export const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial,
  storageKey: ''
});

const reducer = createReducer(
  initialState,
  on(WidgetsLocalStateInternalActions.init,
    (state, action) => ({
      ...state,
      status: EntityStatus.Loading,
      storageKey: action.storageKey
    })
  ),
  on(WidgetsLocalStateServicesActions.setRecord,
    (state, action) => adapter.upsertOne(action.record, state)
  ),
  on(WidgetsLocalStateInternalActions.load,
    (state, action) => ({
      ...adapter.addMany(action.records, state),
      status: EntityStatus.Success
    })
  ),
  on(WidgetsLocalStateInternalActions.removeForWidgets,
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

export const WidgetsLocalStatesFeature = createFeature({
  name: 'WidgetsLocalStates',
  reducer,
  extraSelectors: ({ selectWidgetsLocalStatesState }) => ({
    ...adapter.getSelectors(selectWidgetsLocalStatesState)
  }),
});
