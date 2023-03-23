import { createReducer, on } from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { MobileDashboardActions } from './mobile-dashboard-actions';
import { toInstrumentKey } from "../../shared/utils/instruments";
import { CurrentDashboardVersion, Dashboard } from "../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";

export const mobileDashboardFeatureKey = 'mobile-dashboard';

export interface State {
  dashboard?: Dashboard;
  instrumentsHistory?: InstrumentKey[];
  status: EntityStatus;
}

const initialState: State = {
  status: EntityStatus.Initial,
  dashboard: undefined,
  instrumentsHistory: []
};

export const reducer = createReducer(
  initialState,

  on(MobileDashboardActions.initMobileDashboard, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(MobileDashboardActions.initMobileDashboardSuccess, (state, { mobileDashboard, instrumentsHistory }) => ({
      ...state,
      status: EntityStatus.Success,
      dashboard: {
        ...state.dashboard,
        ...mobileDashboard!
      },
      instrumentsHistory
    })
  ),

  on(MobileDashboardActions.addMobileDashboard, (state, dashboard) => ({
    ...state,
    dashboard: {
      ...dashboard,
      version: CurrentDashboardVersion
    }
  })),

  on(MobileDashboardActions.selectPortfolio, (state, { portfolioKey }) => ({
    ...state,
    dashboard: {
      ...state.dashboard!,
      selectedPortfolio: portfolioKey
        ? {
          portfolio: portfolioKey.portfolio,
          exchange: portfolioKey.exchange,
          marketType: portfolioKey.marketType
        }
        : null
    }
  })),

  on(MobileDashboardActions.selectInstrumentSuccess, (state, props) => {
    if (!state.dashboard) {
      return state;
    }

    const instrumentsSelection = {
      ...state.dashboard.instrumentsSelection
    };

    instrumentsSelection[props.selection.groupKey] = {
      ...toInstrumentKey(props.selection.instrumentKey)
    };

    const isInstrumentInHistory = !!state.instrumentsHistory?.find(i =>
      i.symbol === props.selection.instrumentKey.symbol && i.instrumentGroup === props.selection.instrumentKey.instrumentGroup);

    const instrumentsHistory = isInstrumentInHistory
      ? state.instrumentsHistory ?? []
      : [props.selection.instrumentKey, ...(state.instrumentsHistory) ?? []].slice(0, 3);

    return {
      ...state,
      dashboard: {
        ...state.dashboard,
        instrumentsSelection
      },
      instrumentsHistory
    };
  }),
);
