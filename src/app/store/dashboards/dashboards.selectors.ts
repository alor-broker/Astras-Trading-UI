import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import * as fromDashboards from './dashboards.reducer';

export const selectDashboardsState = createFeatureSelector<fromDashboards.State>(
  fromDashboards.dashboardsFeatureKey
);

export const getDashboardItems = (dashboardGuid: string) => createSelector(
  selectDashboardsState,
  state => state.entities[dashboardGuid]?.items
);
