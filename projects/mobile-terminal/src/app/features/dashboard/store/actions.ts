import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import {InstrumentKey} from "@terminal-core-lib/common/types/instrument.types";
import {
  Dashboard,
  InstrumentGroups,
  Widget
} from "@terminal-core-lib/features/dashboard/types/dashboard.types";
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';

export const MobileDashboardInternalActions = createActionGroup({
  source: 'Mobile Dashboard/Internal',
  events: {
    "Init": props<{
      mobileDashboard: Dashboard | null;
      instrumentsHistory: InstrumentKey[];
    }>(),
    "Init Success": emptyProps(),
    "Add": props<{
      guid: string;
      title: string;
      items: Widget[];
      instrumentsSelection?: InstrumentGroups;
    }>()
  }
});

export const MobileDashboardItemsActions = createActionGroup({
  source: 'Mobile Dashboard/Items',
  events: {
    "Add Widget": props<{
      widget: Omit<Widget, 'guid'>;
    }>(),
    "Update Widget": props<{
      guid: string;
      updates: Partial<Widget>;
    }>()
  }
});

export const MobileDashboardCurrentSelectionActions = createActionGroup({
  source: 'Mobile Dashboard/Current Selection',
  events: {
    "Select Portfolio": props<{ portfolioKey: PortfolioKey | null }>(),
    "Select Instrument": props<{ selection: { groupKey: string, instrumentKey: InstrumentKey } }>()
  }
});

export const MobileDashboardEventsActions = createActionGroup({
  source: 'Mobile Dashboard/Events',
  events: {
    "Updated": props<{ dashboard: Dashboard }>(),
    "Instruments History Updated": props<{ instruments: InstrumentKey[] }>()
  }
});
