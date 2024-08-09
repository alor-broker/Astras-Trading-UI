import {
  createActionGroup,
  emptyProps,
  props
} from '@ngrx/store';
import { Widget } from '../../shared/models/dashboard/widget.model';
import {
  Dashboard,
  InstrumentGroups
} from '../../shared/models/dashboard/dashboard.model';
import { PortfolioKey } from "../../shared/models/portfolio-key.model";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";

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
