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
import { DefaultDashboardName } from '../../shared/models/dashboard/dashboard.model';
import { ManageDashboardsService } from '../../shared/services/manage-dashboards.service';
import {  mapWith } from '../../shared/utils/observable-helper';
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
import { ExchangeSettings } from "../../shared/models/market-settings.model";
import { DashboardsFeature } from "./dashboards.reducer";


@Injectable()
export class DashboardsEffects {
  initDashboards$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(DashboardsInternalActions.init),
        mapWith(
          () => this.marketService.getAllExchanges().pipe(take(1)),
          ({dashboards}, marketSettings) => ({dashboards, marketSettings})
        ),
        switchMap(({dashboards, marketSettings}) => {
          if (!dashboards.length) {
            return EMPTY;
          }

          // This logic needs to replace instruments selection with new badges colors before dashboards init
          // to prevent widgets badges errors
          const defaultSettings = marketSettings.find(x => x.settings.isDefault); // Find default market settings
          const instrumentsSelectionActions: Action[] = [];  // Array with actions to replace dashboard old badges with new

          dashboards.forEach(d => {
            let exchangeSettingsCopy = JSON.parse(JSON.stringify(defaultSettings)) as { exchange: string, settings: ExchangeSettings } | undefined;

            // If portfolio selected, find default settings of selected portfolio exchange
            if (d.selectedPortfolio) {
              exchangeSettingsCopy = marketSettings.find(x => x.exchange === d.selectedPortfolio!.exchange) ?? exchangeSettingsCopy;
            }

            if (exchangeSettingsCopy?.settings.defaultInstrument == null) {
              return;
            }

            // Push the action to replace old badges with new
            instrumentsSelectionActions.push(DashboardsCurrentSelectionActions.selectInstruments({
              dashboardGuid: d.guid,
              selection: instrumentsBadges.map(badge => ({
                groupKey: badge,
                instrumentKey: d.instrumentsSelection?.[badge] ?? {
                  ...exchangeSettingsCopy!.settings.defaultInstrument,
                  exchange: exchangeSettingsCopy!.exchange
                }
              }))
            }));
          });

          // Replace old badges with new and then init dashboards
          return of(...instrumentsSelectionActions, DashboardsInternalActions.initSuccess());
        }),
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
        const newDashboardAction = DashboardsManageActions.add({
          guid: GuidGenerator.newGuid(),
          title: DefaultDashboardName,
          isSelected: true,
          existedItems: []
        });

        return of(
          newDashboardAction,
          DashboardItemsActions.addWidgets({
            dashboardGuid: newDashboardAction.guid,
            widgets: defaultConfig.desktop.widgets.map(w => ({
              widgetType: w.widgetTypeId,
              position: w.position,
              initialSettings: w.initialSettings
            }))
          }),
          DashboardsInternalActions.initSuccess()
        );
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
      switchMap(({dashboardGuid, items, defaultConfig}) => of(
        DashboardItemsActions.removeWidgets({dashboardGuid, widgetIds: items.map(i => i.guid)}),
        DashboardItemsActions.addWidgets({
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
      filter(d => instrumentsBadges.some(badge => !d.instrumentsSelection?.[badge])),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      mapWith(
        () => this.marketService.getAllExchanges().pipe(take(1)),
        (dashboard, marketSettings) => ({dashboard, marketSettings})
      ),
      switchMap(({dashboard, marketSettings}) => {
          let exchangeSettings = marketSettings.find(x => x.settings.isDefault);
          if (dashboard.selectedPortfolio) {
            exchangeSettings = marketSettings.find(x => x.exchange === dashboard.selectedPortfolio!.exchange) ?? exchangeSettings;
          }

          if (!exchangeSettings?.settings.defaultInstrument) {
            return EMPTY;
          }

          return of(DashboardsCurrentSelectionActions.selectInstruments({
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
    private readonly watchlistCollectionService: WatchlistCollectionService
  ) {
  }
}
