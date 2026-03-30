import {
  createFeature,
  createReducer,
  createSelector,
  on
} from '@ngrx/store';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import { toInstrumentKey } from "../../shared/utils/instruments";
import {
  ClientDashboardType,
  CurrentDashboardVersion,
  Dashboard
} from "../../shared/models/dashboard/dashboard.model";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardInternalActions,
  MobileDashboardItemsActions
} from "./mobile-dashboard-actions";
import { GuidGenerator } from "../../shared/utils/guid";

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

    const isInstrumentInHistory = !!(state.instrumentsHistory as InstrumentKey[] | undefined ?? []).find(i =>
      i.symbol === props.selection.instrumentKey.symbol && i.instrumentGroup === props.selection.instrumentKey.instrumentGroup);

    const maxHistoryLength = 5;

    const instrumentsHistory = isInstrumentInHistory
      ? state.instrumentsHistory
      : [toInstrumentKey(props.selection.instrumentKey), ...(state.instrumentsHistory as InstrumentKey[] | undefined ?? [])].slice(0, maxHistoryLength);

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
