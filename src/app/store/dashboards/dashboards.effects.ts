import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs/operators';
import { GuidGenerator } from '../../shared/utils/guid';
import {
  distinctUntilChanged,
  EMPTY,
  of,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import { DefaultDesktopDashboardConfig } from '../../shared/models/dashboard/dashboard.model';
import { ManageDashboardsService } from '../../shared/services/manage-dashboards.service';
import { mapWith } from '../../shared/utils/observable-helper';
import { MarketService } from '../../shared/services/market.service';
import { getDefaultPortfolio, isPortfoliosEqual } from '../../shared/utils/portfolios';
import {
  DashboardFavoritesActions,
  DashboardItemsActions,
  DashboardsCurrentSelectionActions,
  DashboardsEventsActions,
  DashboardsInternalActions,
  DashboardsManageActions
} from './dashboards-actions';
import { instrumentsBadges } from '../../shared/utils/instruments';
import { UserPortfoliosService } from "../../shared/services/user-portfolios.service";
import { DashboardsStreams } from "./dashboards.streams";
import { WatchlistCollectionService } from "../../modules/instruments/services/watchlist-collection.service";
import { DashboardsFeature } from "./dashboards.reducer";
import { TerminalSettingsService } from "../../shared/services/terminal-settings.service";


@Injectable()
export class DashboardsEffects {
  initDashboards$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DashboardsInternalActions.init),
        switchMap(action => {
          if (action.dashboards.length > 0) {
            return of(DashboardsInternalActions.initSuccess());
          }

          return EMPTY;
        })
      );
    }
  );

  createDefaultDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsInternalActions.init),
      filter(action => action.dashboards.length === 0),
      mapWith(
        () => this.dashboardService.getDefaultDashboardConfig(),
        (source, defaultConfig) => defaultConfig
      ),
      switchMap(defaultConfig => {
        const defaultDashboardsConfig = defaultConfig
          .filter(d => d.type === 'desktop')
          .map(d => d as DefaultDesktopDashboardConfig);

        if(defaultDashboardsConfig.length === 0) {
          return EMPTY;
        }

        const actions: Action[] = [];
        defaultDashboardsConfig.forEach((d, index) => {
          const guid = GuidGenerator.newGuid();
          actions.push(DashboardsManageActions.add({
            guid,
            title: d.name,
            isSelected: index === 0,
            existedItems: d.widgets.map(w => ({
              guid: GuidGenerator.newGuid(),
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings
            }))
          }));

          if(d.isFavorite) {
            actions.push(DashboardFavoritesActions.add({dashboardGuid: guid}));
          }
        });


        actions.push(DashboardsInternalActions.initSuccess());

        return of(...actions);
      })
    );
  });

  resetDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.reset),
      mapWith(
        action => this.store.select(DashboardsFeature.getDashboardItems(action.dashboardGuid)).pipe(take(1)),
        (action, items) => ({dashboardGuid: action.dashboardGuid, items: items ?? []})
      ),
      mapWith(
        () => this.dashboardService.getDefaultDashboardConfig(),
        (source, defaultConfig) => ({...source, defaultConfig})
      ),
      switchMap(({dashboardGuid, items, defaultConfig}) => {
        const standardDashboard = defaultConfig
          .filter(d => d.type === 'desktop')
          .map(d => d as DefaultDesktopDashboardConfig)
          .find(d => d.isStandard);

        if(standardDashboard != null) {
          return of(
            DashboardItemsActions.removeWidgets({dashboardGuid, widgetIds: items.map(i => i.guid)}),
            DashboardItemsActions.addWidgets({
                dashboardGuid,
                widgets: standardDashboard.widgets.map(w => ({
                  widgetType: w.widgetTypeId,
                  position: w.position,
                  initialSettings: w.initialSettings
                }))
              }
            )
          );
        }

        return EMPTY;
      })
    );
  });

  deleteDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.remove),
      mapWith(
        action => this.store.select(DashboardsFeature.getDashboardItems(action.dashboardGuid)).pipe(take(1)),
        (action, items) => ({dashboardGuid: action.dashboardGuid, items: items ?? []})
      ),
      switchMap(({dashboardGuid, items}) => of(
        DashboardItemsActions.removeWidgets({dashboardGuid, widgetIds: items.map(i => i.guid)}),
        DashboardsInternalActions.drop({dashboardGuid})
      ))
    );
  });

  createSaveAction$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        DashboardsManageActions.add,
        DashboardsManageActions.rename,
        DashboardItemsActions.addWidgets,
        DashboardItemsActions.removeWidgets,
        DashboardItemsActions.updateWidgetsPositions,
        DashboardsCurrentSelectionActions.select,
        DashboardsManageActions.removeAll,
        DashboardFavoritesActions.add,
        DashboardFavoritesActions.remove,
        DashboardFavoritesActions.changeOrder,
        DashboardsCurrentSelectionActions.selectPortfolio,
        DashboardsCurrentSelectionActions.selectInstruments,
        DashboardsInternalActions.drop
      ),
      withLatestFrom(DashboardsStreams.getAllDashboards(this.store)),
      map(([, dashboards]) => DashboardsEventsActions.updated({dashboards}))
    );
  });

  setDefaultPortfolioForCurrentDashboard$ = createEffect(() => {
    return DashboardsStreams.getSelectedDashboard(this.store).pipe(
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
      map(({dashboard, allPortfolios, defaultExchange}) => DashboardsCurrentSelectionActions.selectPortfolio({
        dashboardGuid: dashboard.guid,
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForCurrentDashboard$ = createEffect(() => {
    return DashboardsStreams.getSelectedDashboard(this.store).pipe(
      mapWith(
        () => this.terminalSettingsService.getSettings().pipe(map(s => s.badgesColors ?? instrumentsBadges)),
        (dashboard, badgesColors) => ({ dashboard, badgesColors })
      ),
      filter(({ dashboard, badgesColors }) => badgesColors.some(badge => dashboard.instrumentsSelection?.[badge] == null)),
      distinctUntilChanged((previous, current) =>
        previous.dashboard.guid === current.dashboard.guid &&
        JSON.stringify(previous.badgesColors) === JSON.stringify(current.badgesColors)
      ),
      mapWith(
        () => this.marketService.getAllExchanges().pipe(take(1)),
        ({ dashboard, badgesColors }, marketSettings) => ({ dashboard, badgesColors, marketSettings })
      ),
      switchMap(({dashboard, badgesColors, marketSettings}) => {
          let exchangeSettings = marketSettings.find(x => x.settings.isDefault);
          if (dashboard.selectedPortfolio) {
            exchangeSettings = marketSettings.find(x => x.exchange === dashboard.selectedPortfolio!.exchange) ?? exchangeSettings;
          }

          if (!exchangeSettings?.settings.defaultInstrument) {
            return EMPTY;
          }

          return of(DashboardsCurrentSelectionActions.selectInstruments({
              dashboardGuid: dashboard.guid,
              selection: badgesColors.map(badge => ({
                groupKey: badge,
                instrumentKey: dashboard.instrumentsSelection?.[badge] ?? {
                  ...exchangeSettings!.settings.defaultInstrument!,
                  exchange: exchangeSettings!.exchange
                }
              }))
            }
          ));
        }
      ));
  });

  addInstrumentToHistory$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(DashboardsCurrentSelectionActions.selectInstruments),
        tap(action => {
            this.watchlistCollectionService.addItemsToHistory(action.selection.map(x => x.instrumentKey));
          }
        )
      );
    },
    {
      dispatch: false
    }
  );

  constructor(
    private readonly actions$: Actions,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService,
    private readonly userPortfoliosService: UserPortfoliosService,
    private readonly watchlistCollectionService: WatchlistCollectionService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }
}
