import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {Store} from '@ngrx/store';
import {filter, map, switchMap,} from 'rxjs/operators';
import {GuidGenerator} from '../../shared/utils/guid';
import {distinctUntilChanged, EMPTY, of, take, withLatestFrom} from 'rxjs';
import {Dashboard,} from '../../shared/models/dashboard/dashboard.model';
import {ManageDashboardsService} from '../../shared/services/manage-dashboards.service';
import {mapWith} from "../../shared/utils/observable-helper";
import {getDefaultPortfolio, isPortfoliosEqual} from "../../shared/utils/portfolios";
import {MarketService} from "../../shared/services/market.service";
import {defaultBadgeColor} from "../../shared/utils/instruments";
import {UserPortfoliosService} from "../../shared/services/user-portfolios.service";
import {MobileDashboardStreams} from "./mobile-dashboard.streams";
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardEventsActions,
  MobileDashboardInternalActions
} from "./mobile-dashboard-actions";
import { MobileDashboardFeature } from "./mobile-dashboard.reducer";

@Injectable()
export class MobileDashboardEffects {
  initMobileDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MobileDashboardInternalActions.init),
      filter(action => !!action.mobileDashboard),
      map(() => {
        return MobileDashboardInternalActions.initSuccess();
      })
    );
  });

  createDefaultMobileDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MobileDashboardInternalActions.init),
      filter(action => !action.mobileDashboard),
      mapWith(
        () => this.dashboardService.getDefaultDashboardConfig(),
        (source, defaultConfig) => defaultConfig
      ),
      switchMap(defaultConfig => {
        return of(
          MobileDashboardInternalActions.add({
            guid: GuidGenerator.newGuid(),
            title: 'Mobile dashboard',
            items: defaultConfig.mobile.widgets.map(w => ({
              guid: GuidGenerator.newGuid(),
              widgetType: w.widgetTypeId,
              initialSettings: w.initialSettings
            }))
          }),
          MobileDashboardInternalActions.initSuccess()
        );
      })
    )
  );

  createDashboardUpdatedAction$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardInternalActions.add,
        MobileDashboardCurrentSelectionActions.selectPortfolio,
        MobileDashboardCurrentSelectionActions.selectInstrument
      ),
      withLatestFrom(MobileDashboardStreams.getMobileDashboard(this.store)),
      map(([, dashboard]) => MobileDashboardEventsActions.updated({dashboard}))
    );
  });

  createInstrumentsHistoryUpdatedAction = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardCurrentSelectionActions.selectInstrument
      ),
      withLatestFrom(this.store.select(MobileDashboardFeature.instrumentsHistory)),
      map(([, history]) => MobileDashboardEventsActions.instrumentsHistoryUpdated({instruments: history ?? []}))
    );
  });

  setDefaultPortfolioForMobileDashboard$ = createEffect(() => {
    return MobileDashboardStreams.getMobileDashboard(this.store).pipe(
      filter(d => !!d),
      mapWith(
        () => this.userPortfoliosService.getPortfolios(),
        (dashboard, allPortfolios) => ({dashboard, allPortfolios})
      ),
      filter(({dashboard, allPortfolios}) =>
        !dashboard!.selectedPortfolio ||
        !allPortfolios.find(p => isPortfoliosEqual(p, dashboard!.selectedPortfolio))
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({...source, defaultExchange})
      ),
      map(({allPortfolios, defaultExchange}) => MobileDashboardCurrentSelectionActions.selectPortfolio({
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForMobileDashboard$ = createEffect(() => {
    return MobileDashboardStreams.getMobileDashboard(this.store).pipe(
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

          return of(MobileDashboardCurrentSelectionActions.selectInstrument({
              selection: {
                groupKey: defaultBadgeColor,
                instrumentKey: {
                  ...exchangeSettings!.settings.defaultInstrument,
                  exchange: exchangeSettings!.exchange
                }
              }
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
