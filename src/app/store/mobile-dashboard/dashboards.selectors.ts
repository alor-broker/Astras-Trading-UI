import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import * as fromDashboards from './dashboards.reducer';

export const selectDashboardsState = createFeatureSelector<fromDashboards.State>(
  fromDashboards.mobileDashboardFeatureKey
);

export const mobileDashboard = createSelector(
  selectDashboardsState,
  state => {
    return state?.dashboard;
  }
);

export const getDashboardItems = createSelector(
  selectDashboardsState,
  state => state.dashboard.items
);
