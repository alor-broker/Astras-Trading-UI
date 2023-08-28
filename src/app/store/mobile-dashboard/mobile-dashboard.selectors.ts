import {
  createFeatureSelector,
  createSelector
} from '@ngrx/store';
import * as fromDashboards from './mobile-dashboard.reducer';

export const selectMobileDashboardsState = createFeatureSelector<fromDashboards.State>(
  fromDashboards.mobileDashboardFeatureKey
);

export const instrumentsHistory = createSelector(
  selectMobileDashboardsState,
  state => state.instrumentsHistory
);
