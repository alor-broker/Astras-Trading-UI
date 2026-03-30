import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { filter, map, switchMap, } from 'rxjs/operators';
import { GuidGenerator } from '../../shared/utils/guid';
import { distinctUntilChanged, EMPTY, of, take, withLatestFrom } from 'rxjs';
import {
  ClientDashboardType,
  DefaultMobileDashboardConfig
} from '../../shared/models/dashboard/dashboard.model';
import { ManageDashboardsService } from '../../shared/services/manage-dashboards.service';
import { mapWith } from "../../shared/utils/observable-helper";
import { getDefaultPortfolio, isPortfoliosEqual } from "../../shared/utils/portfolios";
import { MarketService } from "../../shared/services/market.service";
import { defaultBadgeColor } from "../../shared/utils/instruments";
import { UserPortfoliosService } from "../../shared/services/user-portfolios.service";
import { MobileDashboardStreams } from "./mobile-dashboard.streams";
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardEventsActions,
  MobileDashboardInternalActions, MobileDashboardItemsActions
} from "./mobile-dashboard-actions";
import { MobileDashboardFeature } from "./mobile-dashboard.reducer";
import { InitialSettingsMap } from "../../../assets/charting_library";
import { InstrumentKey } from "../../shared/models/instruments/instrument-key.model";
import { Widget } from "../../shared/models/dashboard/widget.model";

@Injectable()
export class MobileDashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly dashboardService = inject(ManageDashboardsService);
  private readonly marketService = inject(MarketService);
  private readonly userPortfoliosService = inject(UserPortfoliosService);

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
        () => this.dashboardService.getDashboardTemplatesConfig(),
        (source, defaultConfig) => defaultConfig
      ),
      switchMap(defaultConfig => {
        const defaultDashboardConfig = defaultConfig.find(x => x.type === ClientDashboardType.ClientMobile) as DefaultMobileDashboardConfig;
        return of(
          MobileDashboardInternalActions.add({
            guid: GuidGenerator.newGuid(),
            title: 'Mobile dashboard',
            items: defaultDashboardConfig.widgets.map(w => ({
              guid: GuidGenerator.newGuid(),
              widgetType: w.widgetTypeId,
              initialSettings: w.initialSettings as InitialSettingsMap
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
        MobileDashboardCurrentSelectionActions.selectInstrument,
        MobileDashboardItemsActions.addWidget,
        MobileDashboardItemsActions.updateWidget
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
      map(([, history]) => MobileDashboardEventsActions.instrumentsHistoryUpdated({instruments: (history as InstrumentKey[] | undefined) ?? []}))
    );
  });

  setDefaultPortfolioForMobileDashboard$ = createEffect(() => {
    return MobileDashboardStreams.getMobileDashboard(this.store).pipe(
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
      filter(d => d.instrumentsSelection == null),
      distinctUntilChanged((previous, current) => previous.guid === current.guid),
      mapWith(
        () => this.marketService.getAllExchanges().pipe(take(1)),
        (dashboard, marketSettings) => ({dashboard, marketSettings})
      ),
      switchMap(({dashboard, marketSettings}) => {
          let exchangeSettings = marketSettings.find(x => x.settings.isDefault ?? false);
          if (dashboard.selectedPortfolio) {
            exchangeSettings = marketSettings.find(x => x.exchange === dashboard.selectedPortfolio!.portfolio) ?? exchangeSettings;
          }

          if (!exchangeSettings?.settings.defaultInstrument) {
            return EMPTY;
          }

          return of(MobileDashboardCurrentSelectionActions.selectInstrument({
              selection: {
                groupKey: defaultBadgeColor,
                instrumentKey: {
                  ...exchangeSettings!.settings.defaultInstrument,
                  exchange: exchangeSettings!.settings.defaultInstrument!.exchange ?? exchangeSettings!.exchange
                }
              }
            }
          ));
        }
      ));
  });

  setDefaultOrderbookSettings$ = createEffect(() => {
    return MobileDashboardStreams.getMobileDashboard(this.store).pipe(
      map(d => d.items.find(w => w.widgetType === 'order-book')),
      filter((o): o is Widget => o != null && (o.initialSettings?.useOrderWidget ?? false) === false
      ),
      map(o => MobileDashboardItemsActions.updateWidget({
        guid: o.guid,
        updates: {
          initialSettings: {
            useOrderWidget: true
          }
        }
      }))
    );
  });
}
