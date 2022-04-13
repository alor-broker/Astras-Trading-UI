import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromInstruments from './instruments.reducer';

export const selectInstrumentsState = createFeatureSelector<fromInstruments.InstrumentsState>(
  fromInstruments.instrumentsFeatureKey
);

export const getSelectedInstrument = createSelector(
  selectInstrumentsState,
  (state) => state.selectedInstrument
);
