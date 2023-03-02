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
} from 'rxjs/operators';
import { GuidGenerator } from '../../shared/utils/guid';
import { distinctUntilChanged, tap, withLatestFrom } from 'rxjs';
import {
  Dashboard,
} from '../../shared/models/dashboard/dashboard.model';
import { ManageDashboardsService } from '../../shared/services/manage-dashboards.service';
import { mobileDashboard } from './dashboards.selectors';
import { MobileDashboardActions } from './dashboards-actions';
import { mapWith } from "../../shared/utils/observable-helper";
import { PortfoliosStreams } from "../portfolios/portfolios.streams";
import { getDefaultPortfolio, isPortfoliosEqual } from "../../shared/utils/portfolios";
import { MarketService } from "../../shared/services/market.service";
import { instrumentsBadges } from "../../shared/utils/instruments";

@Injectable()
export class MobileDashboardEffects {
  initMobileDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MobileDashboardActions.initMobileDashboard),
      map(() => {
        const dashboard = this.readMobileDashboardFromLocalStorage();

        return MobileDashboardActions.initMobileDashboardSuccess({
            mobileDashboard: dashboard
          }
        );
      })
    );
  });

  createSaveAction$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardActions.addMobileDashboard,
        MobileDashboardActions.selectPortfolio
      ),
      map(() => MobileDashboardActions.saveMobileDashboard())
    );
  });

  saveDashboards$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(MobileDashboardActions.saveMobileDashboard),
        withLatestFrom(this.store.select(mobileDashboard)),
        tap(([, dashboard]) => {
          this.saveMobileDashboardToLocalStorage(dashboard);
        })
      );
    },
    {dispatch: false}
  );

  setDefaultPortfolioForMobileDashboard$ = createEffect(() => {
    return this.store.select(mobileDashboard).pipe(
      filter(d => !!d),
      mapWith(
        () => PortfoliosStreams.getAllPortfolios(this.store),
        (dashboard, allPortfolios) => ({ dashboard, allPortfolios })
      ),
      filter(({ dashboard, allPortfolios }) =>
        !dashboard.selectedPortfolio ||
        !allPortfolios.find(p => isPortfoliosEqual(p, dashboard.selectedPortfolio))
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({ ...source, defaultExchange })
      ),
      map( ({ allPortfolios, defaultExchange}) => MobileDashboardActions.selectPortfolio({
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForMobileDashboard$ = createEffect(() => {
    return this.store.select(mobileDashboard).pipe(
      filter(d => !!d),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      filter(d => !d.instrumentsSelection),
      map(() => MobileDashboardActions.selectInstruments({
          selection: instrumentsBadges.map(badge => ({
            groupKey: badge,
            instrumentKey: {
              symbol: 'SBER',
              exchange: 'MOEX',
              instrumentGroup: 'TQBR'
            }
          }))
        })
      ));
  });

  private readonly mobileDashboardStorageKey = 'mobile-dashboard';

  createDefaultMobileDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MobileDashboardActions.initMobileDashboardSuccess),
      filter(action => !action.mobileDashboard),
      map(() => {
        return MobileDashboardActions.addMobileDashboard({
          guid: GuidGenerator.newGuid(),
          title: 'Mobile dashboard',
          items: this.dashboardService.getMobileDashboardWidgets()
        });
      })
    )
  );

  constructor(
    private readonly actions$: Actions,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService
  ) {
  }

  private readMobileDashboardFromLocalStorage(): Dashboard | undefined {
    return this.localStorage.getItem<Dashboard>(this.mobileDashboardStorageKey);
  }

  private saveMobileDashboardToLocalStorage(dashboard: Dashboard) {
    this.localStorage.setItem(this.mobileDashboardStorageKey, dashboard);
  }
}
