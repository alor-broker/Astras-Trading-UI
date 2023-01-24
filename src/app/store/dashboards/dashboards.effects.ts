import { Injectable } from '@angular/core';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects';
import { LocalStorageService } from '../../shared/services/local-storage.service';
import { Store } from '@ngrx/store';
import {
  filter,
  map,
  switchMap
} from 'rxjs/operators';
import { GuidGenerator } from '../../shared/utils/guid';
import {
  distinctUntilChanged,
  of,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import {
  Dashboard,
  DefaultDashboardName,
  InstrumentGroups
} from '../../shared/models/dashboard/dashboard.model';
import {
  DashboardItemPosition,
  Widget
} from '../../shared/models/dashboard/widget.model';
import { ManageDashboardsService } from '../../shared/services/manage-dashboards.service';
import {
  allDashboards,
  getDashboardItems,
  selectedDashboard
} from './dashboards.selectors';
import { mapWith } from '../../shared/utils/observable-helper';
import { MarketService } from '../../shared/services/market.service';
import { getDefaultPortfolio } from '../../shared/utils/portfolios';
import { PortfoliosStreams } from '../portfolios/portfolios.streams';
import {
  CurrentDashboardActions,
  InternalDashboardActions,
  ManageDashboardsActions
} from './dashboards-actions';
import { InstrumentKey } from '../../shared/models/instruments/instrument-key.model';
import { instrumentsBadges } from '../../shared/utils/instruments';

type ObsoleteItemFormat = {
  guid: string,
  gridItem: DashboardItemPosition & { type: string, label: string }
};

@Injectable()
export class DashboardsEffects {
  initDashboards$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.initDashboards),
      map(() => {
        const dashboards = this.readDashboardsFromLocalStorage();

        return ManageDashboardsActions.initDashboardsSuccess({
            dashboards: dashboards ?? []
          }
        );
      })
    );
  });

  resetDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.resetDashboard),
      mapWith(
        action => this.store.select(getDashboardItems(action.dashboardGuid)).pipe(take(1)),
        (action, items) => ({ dashboardGuid: action.dashboardGuid, items: items ?? [] })
      ),
      switchMap(({ dashboardGuid, items }) => of(
        ManageDashboardsActions.removeWidgets({ dashboardGuid, widgetIds: items.map(i => i.guid) }),
        ManageDashboardsActions.addWidgets({ dashboardGuid, widgets: this.dashboardService.getDefaultWidgetsSet() })
      ))
    );
  });

  deleteDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeDashboard),
      mapWith(
        action => this.store.select(getDashboardItems(action.dashboardGuid)).pipe(take(1)),
        (action, items) => ({ dashboardGuid: action.dashboardGuid, items: items ?? [] })
      ),
      switchMap(({ dashboardGuid, items }) => of(
        ManageDashboardsActions.removeWidgets({ dashboardGuid, widgetIds: items.map(i => i.guid) }),
        InternalDashboardActions.dropDashboardEntity({ dashboardGuid })
      ))
    );
  });

  createSaveAction$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        ManageDashboardsActions.addDashboard,
        ManageDashboardsActions.renameDashboard,
        ManageDashboardsActions.addWidgets,
        ManageDashboardsActions.removeWidgets,
        ManageDashboardsActions.updateWidgetPosition,
        ManageDashboardsActions.selectDashboard,
        ManageDashboardsActions.removeDashboard,
        ManageDashboardsActions.removeAllDashboards,
        CurrentDashboardActions.selectPortfolio,
        CurrentDashboardActions.selectInstruments
      ),
      map(() => ManageDashboardsActions.saveDashboards())
    );
  });

  saveDashboards$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(ManageDashboardsActions.saveDashboards),
        withLatestFrom(this.store.select(allDashboards)),
        tap(([, dashboards]) => {
          this.saveDashboardsToLocalStorage(dashboards);
        })
      );
    },
    { dispatch: false }
  );

  setDefaultPortfolioForCurrentDashboard$ = createEffect(() => {
    return this.store.select(selectedDashboard).pipe(
      filter(d => !!d),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      filter(d => !d.selectedPortfolio),
      mapWith(
        () => PortfoliosStreams.getAllPortfolios(this.store),
        (dashboard, allPortfolios) => ({ dashboard, allPortfolios })
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({ ...source, defaultExchange })
      ),
      map( ({ dashboard, allPortfolios,  defaultExchange}) => CurrentDashboardActions.selectPortfolio({
        dashboardGuid: dashboard.guid,
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForCurrentDashboard$ = createEffect(() => {
    return this.store.select(selectedDashboard).pipe(
      filter(d => !!d),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      filter(d => !d.instrumentsSelection),
      map(d => CurrentDashboardActions.selectInstruments({
          dashboardGuid: d.guid,
          selection: instrumentsBadges.map(badge => ({
            groupKey: badge,
            instrumentKey: {
              symbol: 'SBER',
              exchange: 'MOEX'
            }
          }))
        })
      ));
  });

  private readonly dashboardsStorageKey = 'dashboard-collection';
  private readonly dashboardsObsoleteStorageKey = 'dashboards';
  private readonly instrumentsObsoleteStorageKey = 'instruments';
  convertOrCreateDefault$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.initDashboardsSuccess),
      filter(action => action.dashboards.length === 0),
      switchMap(() => {
        const convertedDashboardItems = this.readObsoleteDashboardFromLocalStorage();
        const newDashboardAction = ManageDashboardsActions.addDashboard({
          guid: GuidGenerator.newGuid(),
          title: DefaultDashboardName,
          isSelected: true,
          existedItems: []
        });

        if (convertedDashboardItems) {
          newDashboardAction.existedItems = convertedDashboardItems;
          this.localStorage.removeItem(this.dashboardsObsoleteStorageKey);

          const convertedInstruments = this.readObsoleteInstrumentsSelection();
          if (convertedInstruments) {
            newDashboardAction.instrumentsSelection = convertedInstruments;
            this.localStorage.removeItem(this.instrumentsObsoleteStorageKey);
          }

          return of(newDashboardAction);
        }

        return of(
          newDashboardAction,
          ManageDashboardsActions.addWidgets({
            dashboardGuid: newDashboardAction.guid,
            widgets: this.dashboardService.getDefaultWidgetsSet()
          })
        );
      })
    );
  });

  constructor(
    private readonly actions$: Actions,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService) {
  }

  private readDashboardsFromLocalStorage(): Dashboard[] | undefined {
    return this.localStorage.getItem<Dashboard[]>(this.dashboardsStorageKey);
  }

  private saveDashboardsToLocalStorage(dashboards: Dashboard[]) {
    this.localStorage.setItem(this.dashboardsStorageKey, dashboards ?? []);
  }

  private readObsoleteDashboardFromLocalStorage(): Widget[] | undefined {
    const obsoleteDashboards = this.localStorage.getItem<[string, ObsoleteItemFormat][]>(this.dashboardsObsoleteStorageKey);

    if (!obsoleteDashboards) {
      return undefined;
    }

    return obsoleteDashboards
      .map(x => x[1])
      .map(x => ({
        guid: x.gridItem.label,
        widgetType: x.gridItem.type,
        position: {
          x: x.gridItem.x,
          y: x.gridItem.y,
          cols: x.gridItem.cols,
          rows: x.gridItem.rows
        }
      }));
  }

  private readObsoleteInstrumentsSelection(): InstrumentGroups | undefined {
    const obsoleteInstruments = this.localStorage.getItem<InstrumentGroups>(this.instrumentsObsoleteStorageKey);

    if (!obsoleteInstruments) {
      return undefined;
    }

    return Object.keys(obsoleteInstruments).reduce(
      (p, c) => {
        const instrument = obsoleteInstruments[c];

        return {
          ...p,
          [c]: {
            symbol: instrument.symbol,
            exchange: instrument.exchange,
            instrumentGroup: instrument.instrumentGroup,
            isin: instrument.isin
          } as InstrumentKey
        };
      },
      {} as InstrumentGroups
    );
  }
}
