import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {filter, map, switchMap} from 'rxjs/operators';
import {GuidGenerator} from '../../shared/utils/guid';
import {distinctUntilChanged, EMPTY, of, take, withLatestFrom} from 'rxjs';
import {Dashboard, DefaultDashboardName} from '../../shared/models/dashboard/dashboard.model';
import {ManageDashboardsService} from '../../shared/services/manage-dashboards.service';
import { getDashboardItems } from './dashboards.selectors';
import {mapWith} from '../../shared/utils/observable-helper';
import {MarketService} from '../../shared/services/market.service';
import {getDefaultPortfolio, isPortfoliosEqual} from '../../shared/utils/portfolios';
import {CurrentDashboardActions, InternalDashboardActions, ManageDashboardsActions} from './dashboards-actions';
import {instrumentsBadges} from '../../shared/utils/instruments';
import {UserPortfoliosService} from "../../shared/services/user-portfolios.service";
import {DashboardsStreams} from "./dashboards.streams";


@Injectable()
export class DashboardsEffects {
  initDashboards$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ManageDashboardsActions.initDashboards),
        switchMap(action => {
          if (action.dashboards.length > 0) {
            return of(ManageDashboardsActions.initDashboardsSuccess());
          }

          return EMPTY;
        })
      );
    }
  );

  createDefaultDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.initDashboards),
      filter(action => action.dashboards.length === 0),
      mapWith(
        () => this.dashboardService.getDefaultDashboardConfig(),
        (source, defaultConfig) => defaultConfig
      ),
      switchMap(defaultConfig => {
        const newDashboardAction = ManageDashboardsActions.addDashboard({
          guid: GuidGenerator.newGuid(),
          title: DefaultDashboardName,
          isSelected: true,
          existedItems: []
        });

        return of(
          newDashboardAction,
          ManageDashboardsActions.addWidgets({
            dashboardGuid: newDashboardAction.guid,
            widgets: defaultConfig.desktop.widgets.map(w => ({
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings
            }))
          }),
          ManageDashboardsActions.initDashboardsSuccess()
        );
      })
    );
  });

  resetDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.resetDashboard),
      mapWith(
        action => this.store.select(getDashboardItems(action.dashboardGuid)).pipe(take(1)),
        (action, items) => ({dashboardGuid: action.dashboardGuid, items: items ?? []})
      ),
      mapWith(
        () => this.dashboardService.getDefaultDashboardConfig(),
        (source, defaultConfig) => ({...source, defaultConfig})
      ),
      switchMap(({dashboardGuid, items, defaultConfig}) => of(
        ManageDashboardsActions.removeWidgets({dashboardGuid, widgetIds: items.map(i => i.guid)}),
        ManageDashboardsActions.addWidgets({
            dashboardGuid,
            widgets: defaultConfig.desktop.widgets.map(w => ({
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings
            }))
          }
        )
      ))
    );
  });

  deleteDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ManageDashboardsActions.removeDashboard),
      mapWith(
        action => this.store.select(getDashboardItems(action.dashboardGuid)).pipe(take(1)),
        (action, items) => ({dashboardGuid: action.dashboardGuid, items: items ?? []})
      ),
      switchMap(({dashboardGuid, items}) => of(
        ManageDashboardsActions.removeWidgets({dashboardGuid, widgetIds: items.map(i => i.guid)}),
        InternalDashboardActions.dropDashboardEntity({dashboardGuid})
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
        ManageDashboardsActions.updateWidgetPositions,
        ManageDashboardsActions.selectDashboard,
        ManageDashboardsActions.removeAllDashboards,
        ManageDashboardsActions.addDashboardToFavorites,
        ManageDashboardsActions.removeDashboardFromFavorites,
        ManageDashboardsActions.changeFavoriteDashboardsOrder,
        CurrentDashboardActions.selectPortfolio,
        CurrentDashboardActions.selectInstruments,
        InternalDashboardActions.dropDashboardEntity
      ),
      withLatestFrom(DashboardsStreams.getAllDashboards(this.store)),
      map(([, dashboards]) => ManageDashboardsActions.dashboardsUpdated({dashboards}))
    );
  });

  setDefaultPortfolioForCurrentDashboard$ = createEffect(() => {
    return DashboardsStreams.getSelectedDashboard(this.store).pipe(
      filter(d => !!d),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      mapWith(
        () => this.userPortfoliosService.getPortfolios(),
        (dashboard, allPortfolios) => ({dashboard, allPortfolios})
      ),
      filter(({dashboard, allPortfolios}) =>
        !dashboard.selectedPortfolio ||
        !allPortfolios.find(p => isPortfoliosEqual(p, dashboard.selectedPortfolio))
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({...source, defaultExchange})
      ),
      map(({dashboard, allPortfolios, defaultExchange}) => CurrentDashboardActions.selectPortfolio({
        dashboardGuid: dashboard.guid,
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForCurrentDashboard$ = createEffect(() => {
    return DashboardsStreams.getSelectedDashboard(this.store).pipe(
      filter((d): d is Dashboard => !!d),
      filter(d => instrumentsBadges.some(badge => !d.instrumentsSelection?.[badge])),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      mapWith(
        () => this.marketService.getAllExchanges().pipe(take(1)),
        (dashboard, marketSettings) => ({dashboard, marketSettings})
      ),
      switchMap(({dashboard, marketSettings}) => {
          let exchangeSettings = marketSettings.find(x => x.settings.isDefault);
          if (dashboard.selectedPortfolio) {
            exchangeSettings = marketSettings.find(x => x.exchange === dashboard.selectedPortfolio!.portfolio) ?? exchangeSettings;
          }

          if (!exchangeSettings || !exchangeSettings.settings.defaultInstrument) {
            return EMPTY;
          }

          return of(CurrentDashboardActions.selectInstruments({
              dashboardGuid: dashboard.guid,
              selection: instrumentsBadges.map(badge => ({
                groupKey: badge,
                instrumentKey: dashboard.instrumentsSelection?.[badge] ?? {
                  ...exchangeSettings!.settings.defaultInstrument,
                  exchange: exchangeSettings!.exchange
                }
              }))
            }
          ));
        }
      ));
  });

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService,
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
  }
}
