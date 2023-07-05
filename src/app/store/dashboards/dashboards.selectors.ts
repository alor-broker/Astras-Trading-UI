import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import * as fromDashboards from './dashboards.reducer';
import { adapter } from './dashboards.reducer';

const selectors = adapter.getSelectors();
export const selectDashboardsState = createFeatureSelector<fromDashboards.State>(
  fromDashboards.dashboardsFeatureKey
);

export const selectedDashboard = createSelector(
  selectDashboardsState,
  state => {
    const all = selectors.selectAll(state);
    const selected = all.find(s => s.isSelected);

    return selected ?? all[0];
  }
);

export const allDashboards = createSelector(
  selectDashboardsState,
  selectors.selectAll
);

export const getDashboardItems = (dashboardGuid: string) => createSelector(
  selectDashboardsState,
  state => state.entities[dashboardGuid]?.items
);
