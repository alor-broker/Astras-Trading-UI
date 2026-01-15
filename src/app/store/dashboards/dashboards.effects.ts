import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap } from 'rxjs/operators';
import {
  distinctUntilChanged,
  EMPTY,
  of,
  take,
  tap,
  withLatestFrom
} from 'rxjs';
import {
  ClientDashboardType,
  DefaultDesktopDashboardConfig
} from '../../shared/models/dashboard/dashboard.model';
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
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly dashboardService = inject(ManageDashboardsService);
  private readonly marketService = inject(MarketService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);
  private readonly watchlistCollectionService = inject(WatchlistCollectionService);
  private readonly terminalSettingsService = inject(TerminalSettingsService);

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
          if(action.isFavorite) {
            return of(DashboardFavoritesActions.add({dashboardGuid: action.guid}));
          }

          return EMPTY;
        })
      );
    }
  );

  resetDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(DashboardsManageActions.reset),
      switchMap(action => this.store.select(DashboardsFeature.getDashboard(action.dashboardGuid)).pipe(take(1))),
      mapWith(
        () => this.dashboardService.getDashboardTemplatesConfig(),
        (targetDashboard, defaultConfig) => ({targetDashboard, defaultConfig})
      ),
      switchMap(({targetDashboard, defaultConfig}) => {
        if(targetDashboard == null) {
          return EMPTY;
        }
        const templates = defaultConfig
          .filter(d => d.type === (targetDashboard.type ?? ClientDashboardType.ClientDesktop))
          .map(d => d as DefaultDesktopDashboardConfig);

        let targetTemplate = templates.find(t => t.isStandard);

        if(targetDashboard.templateId != null) {
          targetTemplate = templates.find(t => t.id === targetDashboard.templateId) ?? targetTemplate;
        }

        if(targetTemplate != null) {
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
}
