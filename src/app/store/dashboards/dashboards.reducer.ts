import {createReducer, on} from '@ngrx/store';
import {createEntityAdapter, EntityAdapter, EntityState} from '@ngrx/entity';
import {EntityStatus} from '../../shared/models/enums/entity-status';
import {CurrentDashboardVersion, Dashboard} from '../../shared/models/dashboard/dashboard.model';
import {Widget} from '../../shared/models/dashboard/widget.model';
import {GuidGenerator} from '../../shared/utils/guid';
import {CurrentDashboardActions, InternalDashboardActions, ManageDashboardsActions} from './dashboards-actions';
import {toInstrumentKey} from '../../shared/utils/instruments';

export const dashboardsFeatureKey = 'dashboards';

export interface State extends EntityState<Dashboard> {
  status: EntityStatus
}

export const adapter: EntityAdapter<Dashboard> = createEntityAdapter<Dashboard>({
  selectId: model => model.guid
});

const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});

export const reducer = createReducer(
  initialState,

  on(ManageDashboardsActions.initDashboards, (state, {dashboards}) => {
    return adapter.addMany(
      dashboards,
      {
        ...state,
        status: EntityStatus.Loading
      });
  }),

  on(ManageDashboardsActions.initDashboardsSuccess, (state) => ({
    ...state,
    status: EntityStatus.Success
  })),

  on(
    ManageDashboardsActions.addDashboard,
    (state, props) => {
      let updatedState = state;
      if (props.isSelected) {
        updatedState = adapter.updateMany(
          state.ids.map(id => ({
            id: <string>id,
            changes: {
              isSelected: false
            }
          })),
          updatedState
        );
      }

      return adapter.addOne({
          guid: props.guid,
          version: CurrentDashboardVersion,
          title: props.title,
          isSelected: props.isSelected,
          items: props.existedItems.map(x => ({...x})),
          instrumentsSelection: props.instrumentsSelection ?? null,
          sourceGuid: props.sourceGuid
        },
        updatedState);
    }),

  on(ManageDashboardsActions.renameDashboard, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          title: props.title
        }
      },
      state);
  }),

  on(ManageDashboardsActions.changeFavoriteDashboard, (state, props) => {
    const favoritesOrder = Object.values(state.entities).filter(d => d!.isFavorite).length;

    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          isFavorite: props.isFavorite,
          favoritesOrder: props.isFavorite ? favoritesOrder : undefined
        }
      },
      state);
  }),

  on(ManageDashboardsActions.changeFavoriteDashboardsOrder, (state, props) => {
    const dashboards: {id: string, order: number}[] = Object.values(state.entities)
      .filter(d => d!.isFavorite)
      .map(d => ({ id: d!.guid, order: d!.favoritesOrder ?? 0 }));

    dashboards.sort((a, b) => a.order - b.order);

    const currentDashboard = dashboards[props.oldIndex];

    dashboards.splice(props.oldIndex, 1);
    dashboards.splice(props.newIndex, 0, currentDashboard);

    return adapter.updateMany(
      dashboards.map((d, i) => ({
          id: d.id,
          changes: {
            favoritesOrder: i
          }
        })
      ),
      state);
  }),

  on(ManageDashboardsActions.addWidgets, (state, props) => {
    const targetItem = state.entities[props.dashboardGuid];
    if (!targetItem) {
      return state;
    }

    return adapter.updateOne({
        id: targetItem.guid,
        changes: {
          items: [
            ...targetItem.items,
            ...props.widgets.map(w => (<Widget>{
                ...w,
                guid: GuidGenerator.newGuid()
              })
            )
          ]
        }
      },
      state);
  }),

  on(ManageDashboardsActions.removeWidgets, (state, props) => {
    const targetItem = state.entities[props.dashboardGuid];
    if (!targetItem) {
      return state;
    }

    return adapter.updateOne({
        id: targetItem.guid,
        changes: {
          items: targetItem.items.filter(x => !props.widgetIds.includes(x.guid))
        }
      },
      state);
  }),

  on(ManageDashboardsActions.selectDashboard, (state, props) => {
    const updatedState = adapter.updateMany(
      state.ids.map(id => ({
        id: <string>id,
        changes: {
          isSelected: false
        }
      })),
      state
    );

    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          isSelected: true
        }
      },
      updatedState);
  }),

  on(ManageDashboardsActions.updateWidgetPositions, (state, props) => {
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return state;
    }

    const updatedItems = [...targetDashboard.items];

    props.updates.forEach((item) => {
      const targetItemIndex = targetDashboard.items.findIndex(x => x.guid === item.widgetGuid);
      if (targetItemIndex < 0) {
        return;
      }

      updatedItems[targetItemIndex] = {
        ...updatedItems[targetItemIndex],
        position: {
          ...item.position
        }
      };
    });

    return adapter.updateOne(
      {
        id: targetDashboard.guid,
        changes: {
          items: updatedItems
        }
      },
      state
    );
  }),

  on(InternalDashboardActions.dropDashboardEntity, (state, props) => {
    let updatedState = state;
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return updatedState;
    }

    if (targetDashboard.isSelected) {
      const otherDashboardGuids = (state.ids as string[]).filter(x => x !== targetDashboard.guid);
      if (otherDashboardGuids.length === 0) {
        return updatedState;
      }

      updatedState = adapter.updateOne({
          id: otherDashboardGuids[0],
          changes: {
            isSelected: true
          }
        },
        updatedState
      );
    }

    return adapter.removeOne(props.dashboardGuid, updatedState);
  }),

  on(ManageDashboardsActions.removeAllDashboards, (state) => adapter.removeAll(state)),

  on(CurrentDashboardActions.selectPortfolio, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          selectedPortfolio: props.portfolioKey ? {
              portfolio: props.portfolioKey.portfolio,
              exchange: props.portfolioKey.exchange,
              marketType: props.portfolioKey.marketType
            }
            : null
        }
      },
      state);
  }),

  on(CurrentDashboardActions.selectInstruments, (state, props) => {
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return state;
    }

    const instrumentsSelection = {
      ...targetDashboard.instrumentsSelection
    };

    props.selection.forEach(x => {
      instrumentsSelection[x.groupKey] = {
        ...toInstrumentKey(x.instrumentKey)
      };
    });

    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          instrumentsSelection: instrumentsSelection
        }
      },
      state);
  }),
);
