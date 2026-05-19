import {
  inject,
  Injectable
} from "@angular/core";
import {
  Actions,
  createEffect,
  ofType
} from "@ngrx/effects";
import {Store} from "@ngrx/store";
import {MarketService} from '@terminal-core-lib/features/market-config/market.service';
import {PortfoliosStoreFacade} from '@terminal-core-lib/features/portfolios/store/portfolios-store-facade';
import {DashboardTemplatesService} from '@terminal-core-lib/features/dashboard/services/dashboard-templates.service';
import {
  distinctUntilChanged,
  EMPTY,
  filter,
  map,
  of,
  switchMap,
  take,
  withLatestFrom
} from "rxjs";
import {
  MobileDashboardCurrentSelectionActions,
  MobileDashboardEventsActions,
  MobileDashboardInternalActions,
  MobileDashboardItemsActions
} from "./actions";
import {mapWith} from "@terminal-core-lib/common/utils/observable/map-with";
import {
  ClientDashboardType,
  Widget
} from '@terminal-core-lib/features/dashboard/types/dashboard.types';
import {DefaultMobileDashboardConfig} from '@terminal-core-lib/features/dashboard/services/dashboard-templates-service.types';
import {GuidGenerator} from "@terminal-core-lib/common/utils/guid-generator";
import {MobileDashboardStreams} from './streams';
import {MobileDashboardFeature} from './reducer';
import {
  PortfolioKeyEqualityComparer,
  PortfolioKeyHelper
} from '@terminal-core-lib/common/utils/portfolio-key.helper';
import {DefaultBadge} from '@terminal-core-lib/features/instruments/constants/badges.constants';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';

@Injectable()
export class MobileDashboardEffects {
  private readonly actions$ = inject(Actions);

  initMobileDashboard$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(MobileDashboardInternalActions.init),
      filter(action => !!action.mobileDashboard),
      map(() => {
        return MobileDashboardInternalActions.initSuccess();
      })
    );
  });

  private readonly store = inject(Store);

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

  private readonly dashboardTemplatesService = inject(DashboardTemplatesService);

  createDefaultMobileDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(MobileDashboardInternalActions.init),
      filter(action => !action.mobileDashboard),
      mapWith(
        () => this.dashboardTemplatesService.getDashboardTemplatesConfig(),
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
              initialSettings: w.initialSettings
            }))
          }),
          MobileDashboardInternalActions.initSuccess()
        );
      })
    )
  );

  private readonly marketService = inject(MarketService);

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
                groupKey: DefaultBadge,
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

  private readonly userPortfoliosService = inject(PortfoliosStoreFacade);

  setDefaultPortfolioForMobileDashboard$ = createEffect(() => {
    return MobileDashboardStreams.getMobileDashboard(this.store).pipe(
      mapWith(
        () => this.userPortfoliosService.portfolios$,
        (dashboard, allPortfolios) => ({dashboard, allPortfolios})
      ),
      filter(({dashboard, allPortfolios}) =>
        !dashboard!.selectedPortfolio ||
        !allPortfolios.find(p => PortfolioKeyEqualityComparer.equals(p, dashboard!.selectedPortfolio))
      ),
      mapWith(
        () => this.marketService.getDefaultExchange(),
        (source, defaultExchange) => ({...source, defaultExchange})
      ),
      map(({allPortfolios, defaultExchange}) => MobileDashboardCurrentSelectionActions.selectPortfolio({
        portfolioKey: PortfolioKeyHelper.getDefaultPortfolio(allPortfolios, defaultExchange ?? null)
      }))
    );
  });
}
