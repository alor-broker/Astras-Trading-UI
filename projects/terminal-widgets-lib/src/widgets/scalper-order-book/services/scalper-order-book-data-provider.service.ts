import {
  inject,
  Injectable
} from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
} from 'rxjs';
import {
  map,
  startWith
} from 'rxjs/operators';
import {ScalperOrderBookSettingsReadService} from "./scalper-order-book-settings-read.service";
import {DASHBOARD_CONTEXT_SERVICE} from '@terminal-core-lib/features/dashboard/services/dashboard-context-service.types';
import {PortfolioSubscriptionsService} from "@terminal-core-lib/features/portfolios/services/portfolio-subscriptions";
import {PortfolioKey} from '@terminal-core-lib/common/types/portfolio.types';
import {
  OrderBook,
  ScalperOrderBookExtendedSettings
} from '@terminal-widgets-lib/widgets/scalper-order-book/types/scalper-order-book-data-context.types';
import {mapWith} from '@terminal-core-lib/common/utils/observable/map-with';
import {InstrumentEqualityComparer} from '@terminal-core-lib/common/utils/instrument-key.helper';
import {Position} from '@terminal-core-lib/features/portfolios/types/position.types';
import {OrderbookData} from '@terminal-core-lib/features/instruments/services/orderbook-service.types';
import {OrderbookService} from '@terminal-core-lib/features/instruments/services/orderbook.service';

@Injectable()
export class ScalperOrderBookDataProvider {
  private readonly settingsReadService = inject(ScalperOrderBookSettingsReadService);

  private readonly currentDashboardService = inject(DASHBOARD_CONTEXT_SERVICE);

  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);

  private readonly orderbookService = inject(OrderbookService);

  public getOrderBookPortfolio(): Observable<PortfolioKey> {
    return this.currentDashboardService.selectedPortfolio$;
  }

  public getSettingsStream(widgetGuid: string): Observable<ScalperOrderBookExtendedSettings> {
    return this.settingsReadService.readSettings(widgetGuid).pipe(
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  public getOrderBookPositionStream(settings$: Observable<ScalperOrderBookExtendedSettings>, currentPortfolio$: Observable<PortfolioKey>): Observable<Position | null> {
    return settings$.pipe(
      distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev.widgetSettings, curr.widgetSettings)),
      mapWith(
        () => currentPortfolio$,
        (settings, portfolio) => ({settings, portfolio})
      ),
      mapWith(
        x => this.portfolioSubscriptionsService.getAllPositionsSubscription(x.portfolio.portfolio, x.portfolio.exchange),
        (source, positions) => ({...source, positions})
      ),
      map(s => s.positions.find(p => p.targetInstrument.symbol === s.settings.widgetSettings.symbol && p.targetInstrument.exchange === s.settings.widgetSettings.exchange)),
      map(p => (!p || !p.avgPrice ? null : p as Position)),
      startWith(null),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }

  public getOrderBookStream(settings$: Observable<ScalperOrderBookExtendedSettings>): Observable<OrderBook> {
    const getOrderBook = (settings: ScalperOrderBookExtendedSettings): Observable<OrderbookData> =>
      this.orderbookService.getOrderbookSubscription(
        settings.widgetSettings.symbol,
        settings.widgetSettings.exchange,
        settings.widgetSettings.instrumentGroup,
        settings.widgetSettings.depth
      ).pipe(
        startWith(({
          a: [],
          b: []
        } as OrderbookData)),
      );

    return settings$.pipe(
      distinctUntilChanged((prev, curr) => InstrumentEqualityComparer.equals(prev.widgetSettings, curr.widgetSettings)),
      mapWith(
        settings => getOrderBook(settings),
        (settings, rows) => ({instrumentKey: settings.widgetSettings, rows})
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
