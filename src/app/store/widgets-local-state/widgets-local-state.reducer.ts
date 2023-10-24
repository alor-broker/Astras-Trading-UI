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

export const getRecordId = (record: { widgetGuid: string; recordKey: string;}) => {
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
  on(WidgetsLocalStateActions.setWidgetLocalStateRecord,
    (state, action) => adapter.upsertOne(action.record, state)
  ),

  /*
  on(WidgetsLocalStateActions.addWidgetsLocalState,
    (state, action) => adapter.addOne(action.widgetsLocalState, state)
  ),
  on(WidgetsLocalStateActions.upsertWidgetsLocalState,
    (state, action) => adapter.upsertOne(action.widgetsLocalState, state)
  ),
  on(WidgetsLocalStateActions.addWidgetsLocalStates,
    (state, action) => adapter.addMany(action.widgetsLocalStates, state)
  ),
  on(WidgetsLocalStateActions.upsertWidgetsLocalStates,
    (state, action) => adapter.upsertMany(action.widgetsLocalStates, state)
  ),
  on(WidgetsLocalStateActions.updateWidgetsLocalState,
    (state, action) => adapter.updateOne(action.widgetsLocalState, state)
  ),
  on(WidgetsLocalStateActions.updateWidgetsLocalStates,
    (state, action) => adapter.updateMany(action.widgetsLocalStates, state)
  ),
  on(WidgetsLocalStateActions.deleteWidgetsLocalState,
    (state, action) => adapter.removeOne(action.id, state)
  ),
  on(WidgetsLocalStateActions.deleteWidgetsLocalStates,
    (state, action) => adapter.removeMany(action.ids, state)
  ),
  on(WidgetsLocalStateActions.loadWidgetsLocalStates,
    (state, action) => adapter.setAll(action.widgetsLocalStates, state)
  ),
  on(WidgetsLocalStateActions.clearWidgetsLocalStates,
    state => adapter.removeAll(state)
  ),*/
);

export const widgetsLocalStatesFeature = createFeature({
  name: 'widgetsLocalStates',
  reducer,
  extraSelectors: ({ selectWidgetsLocalStatesState }) => ({
    ...adapter.getSelectors(selectWidgetsLocalStatesState)
  }),
});

export const {
  selectIds,
  selectEntities,
  selectAll,
  selectTotal,
} = widgetsLocalStatesFeature;
