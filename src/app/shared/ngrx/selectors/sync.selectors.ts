import { createFeatureSelector, createSelector } from "@ngrx/store";
import { SyncState } from "../reducers/sync.reducer";
import { State } from "../state";

export const getSyncState = createFeatureSelector<State>('sync');

export const getSelectedInstrument = createSelector(
  getSyncState,
  (state) => state.sync.instrument
);

export const getSelectedPortfolio = createSelector(
  getSyncState,
  (state) => state.sync.portfolio
)
