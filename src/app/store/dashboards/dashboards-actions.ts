import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import {
  DashboardItemPosition,
  Widget
} from '../../shared/models/dashboard/widget.model';
import {
  Dashboard,
  DashboardType,
  InstrumentGroups
} from '../../shared/models/dashboard/dashboard.model';
import { PortfolioKey } from '../../shared/models/portfolio-key.model';
import { InstrumentKey } from '../../shared/models/instruments/instrument-key.model';

export const DashboardsManageActions = createActionGroup({
  source: 'Dashboard/Manage',
  events: {
    "Add": props<{
      guid: string;
      title: string;
      isSelected: boolean;
      isFavorite: boolean;
      existedItems: Widget[];
      instrumentsSelection?: InstrumentGroups;
      selectedPortfolio?: PortfolioKey;
      sourceGuid?: string;
      dashboardType: DashboardType;
      templateId?: string;
    }>(),
    "Reset": props<{
      dashboardGuid: string;
    }>(),
    "Rename": props<{
      dashboardGuid: string;
      title: string;
    }>(),
    "Remove": props<{
      dashboardGuid: string;
    }>(),
    "Remove All": emptyProps(),
    "Copy": props<{
      dashboardGuid: string;
    }>(),
    "ChangeLock": props<{
      dashboardGuid: string;
      isLocked: boolean;
    }>()
  }
});

export const DashboardItemsActions = createActionGroup({
  source: 'Dashboard/Items',
  events: {
    "Add Widgets": props<{
      dashboardGuid: string;
      widgets: Omit<Widget, 'guid'>[];
    }>(),
    "Remove Widgets": props<{
      dashboardGuid: string;
      widgetIds: string[];
    }>(),
    "Update Widgets Positions": props<{
      dashboardGuid: string;
      updates: {
        widgetGuid: string;
        position: DashboardItemPosition;
      } [];
    }>()
  }
});

export const DashboardsCurrentSelectionActions = createActionGroup({
  source: 'Dashboard/Current Selection',
  events: {
    "Select": props<{ dashboardGuid: string }>(),
    "Select Portfolio": props<{
      dashboardGuid: string;
      portfolioKey: PortfolioKey | null;
    }>(),
    "Select Instruments": props<{
      dashboardGuid: string;
      selection: { groupKey: string, instrumentKey: InstrumentKey }[];
    }>()
  }
});

export const DashboardFavoritesActions = createActionGroup({
  source: 'Dashboard/Favorites',
  events: {
    "Add": props<{
      dashboardGuid: string;
    }>(),
    "Remove": props<{
      dashboardGuid: string;
    }>(),
    "Change Order": props<{
      dashboardGuid: string;
      newIndex: number;
    }>()
  }
});

export const DashboardsInternalActions = createActionGroup({
  source: 'Dashboard/Internal',
  events: {
    "Init": props<{ dashboards: Dashboard[] }>(),
    "Init Success": emptyProps(),
    "Drop": props<{
      dashboardGuid: string;
    }>(),
    "CleanInitialSettings": props<{ items: { dashboardGuid: string, itemGuids: string[] }[] }>(),
  }
});

export const DashboardsEventsActions = createActionGroup({
  source: 'Dashboard/Events',
  events: {
    "Updated": props<{ dashboards: Dashboard[] }>(),
  }
});
