import { createReducer, on } from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { MobileDashboardActions } from './mobile-dashboard-actions';
import { toInstrumentKey } from "../../shared/utils/instruments";
import { CurrentDashboardVersion, Dashboard } from "../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";

export const mobileDashboardFeatureKey = 'mobile-dashboard';

export interface State {
  dashboard: Dashboard | null;
  instrumentsHistory?: InstrumentKey[];
  status: EntityStatus;
}

const initialState: State = {
  status: EntityStatus.Initial,
  dashboard: null,
  instrumentsHistory: []
};

export const reducer = createReducer(
  initialState,

  on(MobileDashboardActions.initMobileDashboard, (state, { mobileDashboard, instrumentsHistory }) => ({
      ...state,
      status: EntityStatus.Loading,
      dashboard: mobileDashboard,
      instrumentsHistory
    })
  ),

  on(MobileDashboardActions.initMobileDashboardSuccess, (state) => ({
      ...state,
      status: EntityStatus.Success,
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

  on(MobileDashboardActions.selectInstrument, (state, props) => {
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
      : [toInstrumentKey(props.selection.instrumentKey), ...(state.instrumentsHistory) ?? []].slice(0, 3);

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
