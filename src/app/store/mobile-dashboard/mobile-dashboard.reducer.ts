import {
  createFeature,
  createReducer,
  createSelector,
  on
} from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { toInstrumentKey } from "../../shared/utils/instruments";
import {
  CurrentDashboardVersion,
  Dashboard
} from "../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardInternalActions
} from "./mobile-dashboard-actions";

export interface State {
  dashboard: Dashboard | null;
  instrumentsHistory: InstrumentKey[];
  status: EntityStatus;
}

const initialState: State = {
  status: EntityStatus.Initial,
  dashboard: null,
  instrumentsHistory: []
};

const reducer = createReducer(
  initialState,

  on(MobileDashboardInternalActions.init, (state, { mobileDashboard, instrumentsHistory }) => ({
      ...state,
      status: EntityStatus.Loading,
      dashboard: mobileDashboard,
      instrumentsHistory
    })
  ),

  on(MobileDashboardInternalActions.initSuccess, (state) => ({
      ...state,
      status: EntityStatus.Success,
    })
  ),

  on(MobileDashboardInternalActions.add, (state, dashboard) => ({
    ...state,
    dashboard: {
      ...dashboard,
      version: CurrentDashboardVersion
    }
  })),

  on(MobileDashboardCurrentSelectionActions.selectPortfolio, (state, { portfolioKey }) => ({
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

  on(MobileDashboardCurrentSelectionActions.selectInstrument, (state, props) => {
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

export const MobileDashboardFeature = createFeature({
  name: 'MobileDashboard',
  reducer,
  extraSelectors: ({ selectMobileDashboardState }) => ({
    instrumentsHistory: createSelector(
      selectMobileDashboardState,
      state => state.instrumentsHistory
    )
  })
});
