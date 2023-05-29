import {Injectable} from '@angular/core';
import {Actions, createEffect, ofType} from '@ngrx/effects';
import {LocalStorageService} from '../../shared/services/local-storage.service';
import {Store} from '@ngrx/store';
import {filter, map, switchMap,} from 'rxjs/operators';
import {GuidGenerator} from '../../shared/utils/guid';
import {distinctUntilChanged, EMPTY, of, take, tap, withLatestFrom} from 'rxjs';
import {Dashboard,} from '../../shared/models/dashboard/dashboard.model';
import {ManageDashboardsService} from '../../shared/services/manage-dashboards.service';
import {instrumentsHistory, mobileDashboard} from './mobile-dashboard.selectors';
import {MobileDashboardActions} from './mobile-dashboard-actions';
import {mapWith} from "../../shared/utils/observable-helper";
import {PortfoliosStreams} from "../portfolios/portfolios.streams";
import {getDefaultPortfolio, isPortfoliosEqual} from "../../shared/utils/portfolios";
import {MarketService} from "../../shared/services/market.service";
import {InstrumentKey} from "../../shared/models/instruments/instrument-key.model";
import {WidgetSettingsService} from "../../shared/services/widget-settings.service";
import {TerminalSettingsService} from "../../modules/terminal-settings/services/terminal-settings.service";
import {defaultBadgeColor} from "../../shared/utils/instruments";

@Injectable()
export class MobileDashboardEffects {
  initMobileDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MobileDashboardActions.initMobileDashboard),
      map(() => {
        const dashboard = this.readMobileDashboardFromLocalStorage();
        const instrumentsHistory = this.readInstrumentsHistoryFromLocalStorage();
        this.excludeTerminalSettings();

        return MobileDashboardActions.initMobileDashboardSuccess({
            mobileDashboard: dashboard,
            instrumentsHistory
          }
        );
      })
    );
  });

  createSaveAction$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardActions.addMobileDashboard,
        MobileDashboardActions.selectPortfolio,
        MobileDashboardActions.selectInstrument
      ),
      map(() => MobileDashboardActions.saveMobileDashboard())
    );
  });

  saveDashboards$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(MobileDashboardActions.saveMobileDashboard),
        withLatestFrom(this.store.select(mobileDashboard)),
        tap(([, dashboard]) => {
          if (dashboard) {
            this.saveMobileDashboardToLocalStorage(dashboard);
          }
        })
      );
    },
    {dispatch: false}
  );

  createSaveInstrumentsHistoryAction = createEffect(() => {
    return this.actions$.pipe(
      ofType(
        MobileDashboardActions.selectInstrument
      ),
      map(() => MobileDashboardActions.saveInstrumentsHistory())
    );
  });

  saveInstrumentsHistory$ = createEffect(() => {
      return this.actions$.pipe(
        ofType(MobileDashboardActions.saveInstrumentsHistory),
        withLatestFrom(this.store.select(instrumentsHistory)),
        tap(([, instruments]) => {
          this.saveInstrumentsHistoryToLocalStorage(instruments ?? []);
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
      map(({allPortfolios, defaultExchange}) => MobileDashboardActions.selectPortfolio({
        portfolioKey: getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });

  setDefaultInstrumentsSelectionForMobileDashboard$ = createEffect(() => {
    return this.store.select(mobileDashboard).pipe(
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

          return of(MobileDashboardActions.selectInstrument({
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
  createDefaultMobileDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MobileDashboardActions.initMobileDashboardSuccess),
      filter(action => !action.mobileDashboard),
      mapWith(
        () => this.dashboardService.getDefaultDashboardConfig(),
        (source, defaultConfig) => defaultConfig
      ),
      map(defaultConfig => {
        return MobileDashboardActions.addMobileDashboard({
          guid: GuidGenerator.newGuid(),
          title: 'Mobile dashboard',
          items: defaultConfig.mobile.widgets.map(w => ({
            guid: GuidGenerator.newGuid(),
            widgetType: w.widgetTypeId,
            initialSettings: w.initialSettings
          }))
        });
      })
    )
  );
  private readonly mobileDashboardStorageKey = 'mobile-dashboard';
  private readonly instrumentsHistoryStorageKey = 'instruments-history';

  constructor(
    private readonly actions$: Actions,
    private readonly localStorage: LocalStorageService,
    private readonly store: Store,
    private readonly dashboardService: ManageDashboardsService,
    private readonly marketService: MarketService,
    private readonly widgetSettingsService: WidgetSettingsService,
    private readonly terminalSettingsService: TerminalSettingsService
  ) {
  }

  private readMobileDashboardFromLocalStorage(): Dashboard | undefined {
    return this.localStorage.getItem<Dashboard>(this.mobileDashboardStorageKey);
  }

  private saveMobileDashboardToLocalStorage(dashboard: Dashboard) {
    this.localStorage.setItem(this.mobileDashboardStorageKey, dashboard);
  }

  private readInstrumentsHistoryFromLocalStorage(): InstrumentKey[] {
    return this.localStorage.getItem(this.instrumentsHistoryStorageKey) ?? [];
  }

  private saveInstrumentsHistoryToLocalStorage(instruments: InstrumentKey[]) {
    this.localStorage.setItem(this.instrumentsHistoryStorageKey, instruments);
  }

  private excludeTerminalSettings() {
    this.terminalSettingsService.getSettings()
      .pipe(
        take(1)
      )
      .subscribe(s => {
        if (!s.excludedSettings?.length) {
          this.terminalSettingsService.updateSettings({excludedSettings: ['hotKeysSettings', 'badgesBind']});
        }
      });
  }
}
