import {
  createFeatureSelector,
  createSelector, MemoizedSelector
} from '@ngrx/store';
import * as fromDashboards from './dashboards.reducer';
import { Widget } from "../../shared/models/dashboard/widget.model";

export const selectDashboardsState = createFeatureSelector<fromDashboards.State>(
  fromDashboards.dashboardsFeatureKey
);

export const getDashboardItems = (dashboardGuid: string): MemoizedSelector<object, Widget[] | undefined> => createSelector(
  selectDashboardsState,
  state => state.entities[dashboardGuid]?.items
);
