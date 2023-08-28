import {createAction, props} from '@ngrx/store';
import {Widget} from '../../shared/models/dashboard/widget.model';
import {Dashboard, InstrumentGroups} from '../../shared/models/dashboard/dashboard.model';
import {PortfolioKey} from "../../shared/models/portfolio-key.model";
import {InstrumentKey} from "../../shared/models/instruments/instrument-key.model";

export class MobileDashboardActions {
  static initMobileDashboard = createAction(
    '[Mobile Dashboard] Init Mobile Dashboard',
    props<{
      mobileDashboard: Dashboard | null,
      instrumentsHistory: InstrumentKey[]
    }>()
  );

  static initMobileDashboardSuccess = createAction(
    '[Mobile Dashboard] Init Mobile Dashboard (SUCCESS)'
  );

  static addMobileDashboard = createAction(
    '[Mobile Dashboard] Add Mobile Dashboard',
    props<{
      guid: string,
      title: string,
      items: Widget[],
      instrumentsSelection?: InstrumentGroups
    }>()
  );

  static selectPortfolio = createAction(
    '[Mobile Dashboard] Select Portfolio',
    props<{
      portfolioKey: PortfolioKey | null
    }>()
  );

  static selectInstrument = createAction(
    '[Mobile Dashboard] Select Instrument',
    props<{
      selection: { groupKey: string, instrumentKey: InstrumentKey }
    }>()
  );

  static mobileDashboardUpdated = createAction(
    '[Mobile Dashboard] Mobile Dashboard Updated',
    props<{ dashboard: Dashboard }>()
  );

  static instrumentsHistoryUpdated = createAction(
    '[Mobile Dashboard] Instruments History Updated',
    props<{ instruments: InstrumentKey[] }>()
  );
}

