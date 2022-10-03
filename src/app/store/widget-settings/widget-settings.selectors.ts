import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import * as fromWidgetSettings from './widget-settings.reducer';
import {
  adapter,
  State
} from './widget-settings.reducer';
import {
  isInstrumentDependent,
  isPortfolioDependent
} from "../../shared/utils/settings-helper";

export const selectWidgetSettingsState = createFeatureSelector<fromWidgetSettings.State>(
  fromWidgetSettings.widgetSettingsFeatureKey
);

const selectors = adapter.getSelectors();

export const getInstrumentLinkedSettings = createSelector(
  selectWidgetSettingsState,
  state => selectors.selectAll(state).filter(s => s.linkToActive && isInstrumentDependent(s))
);

export const getPortfolioLinkedSettings = createSelector(
  selectWidgetSettingsState,
  state => selectors.selectAll(state).filter(s => s.linkToActive && isPortfolioDependent(s))
);

export const getSettingsByGuid = (guid: string) => createSelector(
  selectWidgetSettingsState,
  (state: State) => state.entities[guid]
);


export const getAllSettings = createSelector(
  selectWidgetSettingsState,
  selectors.selectAll
);
