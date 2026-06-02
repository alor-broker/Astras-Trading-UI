import {InstrumentKey} from "@terminal-core-lib/common/types/instrument.types";
import {
  ClientDashboardType,
  CurrentDashboardVersion,
  Dashboard
} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {EntityStatus} from '@terminal-core-lib/common/types/entity-status.types';
import {
  createFeature,
  createReducer,
  createSelector,
  on
} from '@ngrx/store';
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardInternalActions,
  MobileDashboardItemsActions
} from './actions';
import {GuidGenerator} from '@terminal-core-lib/common/utils/guid-generator';
import {InstrumentKeyHelper} from '@terminal-core-lib/common/utils/instrument-key.helper';

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

  on(MobileDashboardInternalActions.init, (state, {mobileDashboard, instrumentsHistory}) => ({
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
      type: ClientDashboardType.ClientMobile,
      version: CurrentDashboardVersion
    }
  })),

  on(MobileDashboardItemsActions.addWidget, (state, props) => ({
    ...state,
    dashboard: {
      ...state.dashboard!,
      items: [
        ...state.dashboard!.items,
        {
          ...props.widget,
          guid: GuidGenerator.newGuid()
        }
      ]
    }
  })),

  on(MobileDashboardItemsActions.updateWidget, (state, props) => ({
    ...state,
    dashboard: {
      ...state.dashboard!,
      items: state.dashboard!.items.map(w => {
        if (w.guid !== props.guid) {
          return w;
        }

        return {
          ...w,
          ...props.updates
        };
      })
    }
  })),

  on(MobileDashboardCurrentSelectionActions.selectPortfolio, (state, {portfolioKey}) => ({
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
      ...InstrumentKeyHelper.toInstrumentKey(props.selection.instrumentKey)
    };

    const isInstrumentInHistory = !!(state.instrumentsHistory as InstrumentKey[] | undefined ?? []).find(i =>
      i.symbol === props.selection.instrumentKey.symbol && i.instrumentGroup === props.selection.instrumentKey.instrumentGroup);

    const maxHistoryLength = 5;

    const instrumentsHistory = isInstrumentInHistory
      ? state.instrumentsHistory
      : [InstrumentKeyHelper.toInstrumentKey(props.selection.instrumentKey), ...(state.instrumentsHistory as InstrumentKey[] | undefined ?? [])].slice(0, maxHistoryLength);

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
  extraSelectors: ({selectMobileDashboardState}) => ({
    instrumentsHistory: createSelector(
      selectMobileDashboardState,
      state => state.instrumentsHistory
    )
  })
});
