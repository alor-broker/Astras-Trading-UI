import { createFeatureSelector, createSelector } from '@ngrx/store';
import * as fromInstruments from './instruments.reducer';

export const selectInstrumentsState = createFeatureSelector<fromInstruments.InstrumentsState>(
  fromInstruments.instrumentsFeatureKey
);

export const getSelectedInstrumentsWithBadges = createSelector(
  selectInstrumentsState,
  (state) => state.selectedInstrumentWithBadge
);

export const getSelectedInstrumentByBadge = (badgeColor: string) => createSelector(
  selectInstrumentsState,
  (state) => state.selectedInstrumentWithBadge?.[badgeColor]
);
