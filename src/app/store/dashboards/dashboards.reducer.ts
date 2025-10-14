import {
  createFeature,
  createReducer,
  createSelector, MemoizedSelector,
  on
} from '@ngrx/store';
import {
  createEntityAdapter,
  EntityAdapter,
  EntityState
} from '@ngrx/entity';
import { EntityStatus } from '../../shared/models/enums/entity-status';
import {
  CurrentDashboardVersion,
  Dashboard
} from '../../shared/models/dashboard/dashboard.model';
import { Widget } from '../../shared/models/dashboard/widget.model';
import { GuidGenerator } from '../../shared/utils/guid';
import {
  DashboardFavoritesActions,
  DashboardItemsActions,
  DashboardsCurrentSelectionActions,
  DashboardsInternalActions,
  DashboardsManageActions,
} from './dashboards-actions';
import { toInstrumentKey } from '../../shared/utils/instruments';

export interface State extends EntityState<Dashboard> {
  status: EntityStatus;
}

export const adapter: EntityAdapter<Dashboard> = createEntityAdapter<Dashboard>({
  selectId: model => model.guid
});

const initialState: State = adapter.getInitialState({
  status: EntityStatus.Initial
});
const reducer = createReducer(
  initialState,

  on(DashboardsInternalActions.init, (state, { dashboards }) => {
    return adapter.addMany(
      dashboards,
      {
        ...state,
        status: EntityStatus.Loading
      });
  }),

  on(DashboardsInternalActions.initSuccess, (state) => ({
    ...state,
    status: EntityStatus.Success
  })),

  on(
    DashboardsManageActions.add,
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
          items: props.existedItems.map(x => ({ ...x })),
          instrumentsSelection: props.instrumentsSelection ?? null,
          selectedPortfolio: props.selectedPortfolio,
          sourceGuid: props.sourceGuid,
          type: props.dashboardType,
          templateId: props.templateId
        },
        updatedState);
    }),

  on(DashboardsManageActions.rename, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          title: props.title
        }
      },
      state);
  }),

  on(DashboardsManageActions.changeLock, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          isLocked: props.isLocked
        }
      },
      state);
  }),

  on(DashboardFavoritesActions.add, (state, props) => {
    const favoritesOrder = Object.values(state.entities).filter(d => d!.isFavorite ?? false).length;

    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          isFavorite: true,
          favoritesOrder: favoritesOrder
        }
      },
      state);
  }),

  on(DashboardFavoritesActions.remove, (state, props) => {
    const cahnges = Object.values(state.entities)
      .filter(d => (d!.isFavorite ?? false) && d!.guid !== props.dashboardGuid)
      .sort((a, b) => a!.favoritesOrder! - b!.favoritesOrder!)
      .map((d, i) => ({ id: d!.guid, order: i }));

    return adapter.updateMany([
        ...cahnges.map(
          d => ({
            id: d.id,
            changes: {
              favoritesOrder: d.order
            }
          })
        ),
        {
          id: props.dashboardGuid,
          changes: {
            isFavorite: false,
            favoritesOrder: undefined
          }
        }
      ],
      state);
  }),

  on(DashboardFavoritesActions.changeOrder, (state, props) => {
    const dashboards: { id: string, order: number }[] = Object.values(state.entities)
      .filter(d => d!.isFavorite ?? false)
      .map(d => ({ id: d!.guid, order: d!.favoritesOrder ?? 0 }));

    dashboards.sort((a, b) => a.order - b.order);

    const oldIndex = dashboards.findIndex(d => d.id === props.dashboardGuid);

    if (oldIndex === -1) {
      return state;
    }

    dashboards.splice(oldIndex, 1);
    dashboards.splice(props.newIndex, 0, { id: props.dashboardGuid, order: 0 });

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

  on(DashboardItemsActions.addWidgets, (state, props) => {
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

  on(DashboardItemsActions.removeWidgets, (state, props) => {
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

  on(DashboardsCurrentSelectionActions.select, (state, props) => {
    if(props.dashboardGuid == null) {
      return state;
    }

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

  on(DashboardItemsActions.updateWidgetsPositions, (state, props) => {
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

  on(DashboardsInternalActions.drop, (state, props) => {
    let updatedState = state;
    const targetDashboard = state.entities[props.dashboardGuid];
    if (!targetDashboard) {
      return updatedState;
    }

    if (targetDashboard.isSelected ?? false) {
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

  on(DashboardsManageActions.removeAll, (state) => adapter.removeAll(state)),

  on(DashboardsCurrentSelectionActions.selectPortfolio, (state, props) => {
    return adapter.updateOne({
        id: props.dashboardGuid,
        changes: {
          selectedPortfolio: props.portfolioKey
            ? {
              portfolio: props.portfolioKey.portfolio,
              exchange: props.portfolioKey.exchange,
              marketType: props.portfolioKey.marketType
            }
            : null
        }
      },
      state);
  }),

  on(DashboardsCurrentSelectionActions.selectInstruments, (state, props) => {
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

  on(DashboardsInternalActions.cleanInitialSettings, (state, props) => {
    let updatedState = state;

    for (const itemToUpdate of props.items) {
      const targetDashboard = state.entities[itemToUpdate.dashboardGuid];
      if(targetDashboard != null) {
        const updatedDashboardItems: Widget[] = [];
        for (const dashboardItem of targetDashboard.items) {
          const updatedItem = {
            ...dashboardItem
          };

          if(itemToUpdate.itemGuids.includes(dashboardItem.guid)) {
            delete updatedItem.initialSettings;
          }

          updatedDashboardItems.push(updatedItem);
        }

        updatedState = adapter.updateOne({
            id: targetDashboard.guid,
            changes: {
              items: updatedDashboardItems
            }
          },
          updatedState
        );
      }
    }

    return updatedState;
  }),
);

export const DashboardsFeature = createFeature({
  name: 'Dashboards',
  reducer,
  extraSelectors: ({ selectDashboardsState }) => ({
    getDashboardItems: (dashboardGuid: string): MemoizedSelector<Record<string, any>, Widget[] | undefined> => createSelector(
      selectDashboardsState,
      state => state.entities[dashboardGuid]?.items
    ),
    getDashboard:(dashboardGuid: string): MemoizedSelector<Record<string, any>, Dashboard | undefined> => createSelector(
      selectDashboardsState,
      state => state.entities[dashboardGuid]
    ),
  })
});
