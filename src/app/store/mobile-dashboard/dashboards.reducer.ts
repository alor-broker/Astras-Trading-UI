import { createReducer, on } from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { MobileDashboardActions } from './dashboards-actions';
import { toInstrumentKey } from "../../shared/utils/instruments";

export const mobileDashboardFeatureKey = 'mobile-dashboard';

export interface State {
  dashboard?: any,
  status: EntityStatus
}

const initialState: State = {
  status: EntityStatus.Initial,
  dashboard: undefined
};

export const reducer = createReducer(
  initialState,

  on(MobileDashboardActions.initMobileDashboard, (state) => ({
    ...state,
    status: EntityStatus.Loading
  })),

  on(MobileDashboardActions.initMobileDashboardSuccess, (state, {mobileDashboard}) => ({
      ...state,
      status: EntityStatus.Success,
      dashboard: {
        ...state.dashboard,
        ...mobileDashboard
      }
    })
  ),

  on(MobileDashboardActions.addMobileDashboard, (state, dashboard) => ({
    ...state,
    dashboard: {
      ...dashboard
    }
  })),

  on(MobileDashboardActions.selectPortfolio, (state, { portfolioKey }) => ({
    ...state,
    dashboard: {
      ...state.dashboard,
      selectedPortfolio: portfolioKey
        ? {
          portfolio: portfolioKey.portfolio,
          exchange: portfolioKey.exchange,
          marketType: portfolioKey.marketType
        }
        : null
    }
  })),

  on(MobileDashboardActions.selectInstruments, (state, props) => {
    if (!state.dashboard) {
      return state;
    }

    const instrumentsSelection = {
      ...state.dashboard.instrumentsSelection
    };

    props.selection.forEach(x => {
      instrumentsSelection[x.groupKey] = {
        ...toInstrumentKey(x.instrumentKey)
      };
    });

    return {
      ...state,
      dashboard: {
        ...state.dashboard,
        instrumentsSelection
      }
    };
  }),
);
