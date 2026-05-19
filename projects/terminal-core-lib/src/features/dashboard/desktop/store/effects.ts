import {
  inject,
  Injectable
} from '@angular/core';
import {Store} from '@ngrx/store';
import {
  Actions,
  createEffect,
  ofType
} from '@ngrx/effects'
import {MarketService} from '../../../market-config/market.service';
import {PortfoliosStoreFacade} from '../../../portfolios/store/portfolios-store-facade';
import {
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  of,
  switchMap,
  take,
  tap,
  withLatestFrom
} from "rxjs";
import {
  DashboardFavoritesActions,
  DashboardItemsActions,
  DashboardsCurrentSelectionActions,
  DashboardsEventsActions,
  DashboardsInternalActions,
  DashboardsManageActions
} from './actions';
import {mapWith} from '../../../../common/utils/observable/map-with';
import {ClientDashboardType} from '../../types/dashboard.types';
import {DashboardsFeature} from './reducer';
import {DashboardsStreams} from "./streams";
import {
  PortfolioKeyEqualityComparer,
  PortfolioKeyHelper
} from '../../../../common/utils/portfolio-key.helper';
import {WatchlistCollectionService} from '../../../watchlist/services/watchlist-collection.service';
import {TerminalSettingsService} from '../../../terminal-settings/services/terminal-settings.service';
import {BaseBadges} from '../../../instruments/constants/badges.constants';
import {DashboardTemplatesService} from '../../services/dashboard-templates.service';
import {DefaultDesktopDashboardConfig} from '../../services/dashboard-templates-service.types';

@Injectable()
export class DashboardsEffects {
  private readonly actions$ = inject(Actions);

  initDashboards$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DashboardsInternalActions.init),
        switchMap(() => {
          return of(DashboardsInternalActions.initSuccess());
        })
      );
    }
  );

  addToFavoritesNewItems$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DashboardsManageActions.add),
        switchMap(action => {
          if (action.isFavorite) {
            return of(DashboardFavoritesActions.add({dashboardGuid: action.guid}));
          }

          return EMPTY;
        })
      );
    }
  );

  private readonly store = inject(Store);

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
        DashboardsManageActions.changeLock,
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
        DashboardsInternalActions.drop,
        DashboardsInternalActions.cleanInitialSettings
      ),
      withLatestFrom(DashboardsStreams.getAllDashboards(this.store)),
      map(([, dashboards]) => DashboardsEventsActions.updated({dashboards}))
    );
  });

  private readonly dashboardTemplatesService = inject(DashboardTemplatesService);

  resetDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.reset),
      switchMap(action => this.store.select(DashboardsFeature.getDashboard(action.dashboardGuid)).pipe(take(1))),
      mapWith(
        () => this.dashboardTemplatesService.getDashboardTemplatesConfig(),
        (targetDashboard, defaultConfig) => ({targetDashboard, defaultConfig})
      ),
      switchMap(({targetDashboard, defaultConfig}) => {
          if (targetDashboard == null) {
            return EMPTY;
          }
          const templates = defaultConfig
            .filter(d => d.type === (targetDashboard.type ?? ClientDashboardType.ClientDesktop))
            .map(d => d as DefaultDesktopDashboardConfig);

          let targetTemplate = templates.find(t => t.isStandard);

          if (targetDashboard.templateId != null) {
            targetTemplate = templates.find(t => t.id === targetDashboard.templateId) ?? targetTemplate;
          }

          if (targetTemplate != null) {
            return of(
              DashboardItemsActions.removeWidgets({
                dashboardGuid: targetDashboard.guid,
                widgetIds: targetDashboard.items.map(i => i.guid)
              }),
              DashboardItemsActions.addWidgets({
                  dashboardGuid: targetDashboard.guid,
                  widgets: targetTemplate.widgets.map(w => ({
                    widgetType: w.widgetTypeId,
                    position: w.position,
                    initialSettings: w.initialSettings
                  }))
                }
              )
            );
          }

          return EMPTY;
        }
      )
    );
  });

  private readonly marketService = inject(MarketService);

  private readonly userPortfoliosService = inject(PortfoliosStoreFacade);

  setDefaultPortfolioForCurrentDashboard$ = createEffect(() => {
    return DashboardsStreams.getSelectedDashboard(this.store).pipe(
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      mapWith(
        () => this.userPortfoliosService.portfolios$,
        (dashboard, allPortfolios) => ({dashboard, allPortfolios})
      ),
      filter(({dashboard, allPortfolios}) =>
        !dashboard.selectedPortfolio ||
        !allPortfolios.find(p => PortfolioKeyEqualityComparer.equals(p, dashboard.selectedPortfolio))
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({...source, defaultExchange})
      ),
      map(({dashboard, allPortfolios, defaultExchange}) => DashboardsCurrentSelectionActions.selectPortfolio({
        dashboardGuid: dashboard.guid,
        portfolioKey: PortfolioKeyHelper.getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  private readonly watchlistCollectionService = inject(WatchlistCollectionService);

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

  private readonly terminalSettingsService = inject(TerminalSettingsService);

  setDefaultInstrumentsSelectionForCurrentDashboard$ = createEffect(() => {
    return DashboardsStreams.getSelectedDashboard(this.store).pipe(
      mapWith(
        () => this.terminalSettingsService.getSettings().pipe(map(s => s.badgesColors ?? BaseBadges)),
        (dashboard, badgesColors) => ({dashboard, badgesColors})
      ),
      filter(({
                dashboard,
                badgesColors
              }) => badgesColors.some(badge => dashboard.instrumentsSelection?.[badge] == null)),
      distinctUntilChanged((previous, current) =>
        previous.dashboard.guid === current.dashboard.guid &&
        JSON.stringify(previous.badgesColors) === JSON.stringify(current.badgesColors)
      ),
      mapWith(
        () => this.marketService.getAllExchanges().pipe(take(1)),
        ({dashboard, badgesColors}, marketSettings) => ({dashboard, badgesColors, marketSettings})
      ),
      switchMap(({dashboard, badgesColors, marketSettings}) => {
          let exchangeSettings = marketSettings.find(x => x.settings.isDefault ?? false);
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
                  exchange: exchangeSettings!.settings.defaultInstrument!.exchange ?? exchangeSettings!.exchange
                }
              }))
            }
          ));
        }
      ));
  });
}
