import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import {
  Dashboard,
  DashboardItemPosition,
  DashboardType,
  InstrumentGroups,
  Widget
} from '../../types/dashboard.types';
import {PortfolioKey} from '../../../../common/types/portfolio.types';
import {InstrumentKey} from '../../../../common/types/instrument.types';

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
      title?: string;
      selectedPortfolio?: PortfolioKey;
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
    "Set Instruments Selection": props<{
      dashboardGuid: string;
      instrumentsSelection: InstrumentGroups;
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
