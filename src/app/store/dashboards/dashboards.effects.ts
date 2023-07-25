import {Injectable} from '@angular/core';
import {Actions, concatLatestFrom, createEffect, ofType} from '@ngrx/effects';
import {LocalStorageService} from '../../shared/services/local-storage.service';
import {Store} from '@ngrx/store';
import {filter, map, switchMap} from 'rxjs/operators';
import {GuidGenerator} from '../../shared/utils/guid';
import {distinctUntilChanged, EMPTY, of, take, tap} from 'rxjs';
import {Dashboard, DefaultDashboardName} from '../../shared/models/dashboard/dashboard.model';
import {ManageDashboardsService} from '../../shared/services/manage-dashboards.service';
import {allDashboards, getDashboardItems, selectedDashboard} from './dashboards.selectors';
import {mapWith} from '../../shared/utils/observable-helper';
import {MarketService} from '../../shared/services/market.service';
import {getDefaultPortfolio, isPortfoliosEqual} from '../../shared/utils/portfolios';
import {CurrentDashboardActions, InternalDashboardActions, ManageDashboardsActions} from './dashboards-actions';
import {instrumentsBadges} from '../../shared/utils/instruments';
import {TerminalSettingsService} from "../../modules/terminal-settings/services/terminal-settings.service";
import {UserPortfoliosService} from "../../shared/services/user-portfolios.service";


@Injectable()
export class DashboardsEffects {
  initDashboards$ = createEffect(
    () => {
      return this.actions$.pipe(
        ofType(ManageDashboardsActions.initDashboards),
        tap(() => {
          this.includeTerminalSettings();
        })
      );
    },
    {
      dispatch: false
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
        ManageDashboardsActions.removeDashboard,
        ManageDashboardsActions.removeAllDashboards,
        CurrentDashboardActions.selectPortfolio,
        CurrentDashboardActions.selectInstruments
      ),
      concatLatestFrom(() => this.store.select(allDashboards)),
      map(([, dashboards]) => ManageDashboardsActions.saveDashboards({dashboards}))
    );
  });

  setDefaultPortfolioForCurrentDashboard$ = createEffect(() => {
    return this.store.select(selectedDashboard).pipe(
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
    return this.store.select(selectedDashboard).pipe(
      filter((d): d is Dashboard => !!d),
      filter(d => !d.instrumentsSelection),
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
                instrumentKey: {
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
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService,
    private readonly terminalSettingsService: TerminalSettingsService,
    private readonly userPortfoliosService: UserPortfoliosService
  ) {
  }

  private includeTerminalSettings() {
    this.terminalSettingsService.getSettings()
      .pipe(
        take(1)
      )
      .subscribe(s => {
        if (s.excludedSettings?.length) {
          this.terminalSettingsService.updateSettings({excludedSettings: []});
        }
      });
  }
}
