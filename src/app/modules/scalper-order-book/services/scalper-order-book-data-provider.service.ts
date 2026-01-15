import { Injectable, inject } from '@angular/core';
import {
  distinctUntilChanged,
  Observable,
  shareReplay,
} from 'rxjs';
import {
  OrderBook,
  ScalperOrderBookExtendedSettings
} from '../models/scalper-order-book-data-context.model';
import { mapWith } from '../../../shared/utils/observable-helper';
import { DashboardContextService } from '../../../shared/services/dashboard-context.service';
import { PortfolioKey } from '../../../shared/models/portfolio-key.model';
import { Position } from '../../../shared/models/positions/position.model';
import {
  map,
  startWith
} from 'rxjs/operators';
import { PortfolioSubscriptionsService } from '../../../shared/services/portfolio-subscriptions.service';
import { OrderBookDataFeedHelper } from '../../orderbook/utils/order-book-data-feed.helper';
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';
import {
  OrderbookData,
  OrderbookRequest
} from '../../orderbook/models/orderbook-data.model';
import { ScalperOrderBookSettingsReadService } from "./scalper-order-book-settings-read.service";
import { isInstrumentEqual } from "../../../shared/utils/settings-helper";

@Injectable({
  providedIn: 'root'
})
export class ScalperOrderBookDataProvider {
  private readonly settingsReadService = inject(ScalperOrderBookSettingsReadService);
  private readonly currentDashboardService = inject(DashboardContextService);
  private readonly portfolioSubscriptionsService = inject(PortfolioSubscriptionsService);
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

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
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
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
    const getOrderBook = (settings: ScalperOrderBookExtendedSettings): Observable<OrderbookData> => this.subscriptionsDataFeedService.subscribe<OrderbookRequest, OrderbookData>(
      OrderBookDataFeedHelper.getRealtimeDateRequest(
        settings.widgetSettings.symbol,
        settings.widgetSettings.exchange,
        settings.widgetSettings.instrumentGroup,
        settings.widgetSettings.depth
      ),
      OrderBookDataFeedHelper.getOrderbookSubscriptionId
    ).pipe(
      startWith(({
        a: [],
        b: []
      } as OrderbookData)),
    );

    return settings$.pipe(
      distinctUntilChanged((prev, curr) => isInstrumentEqual(prev.widgetSettings, curr.widgetSettings)),
      mapWith(
        settings => getOrderBook(settings),
        (settings, rows) => ({instrumentKey: settings.widgetSettings, rows})
      ),
      shareReplay({bufferSize: 1, refCount: true})
    );
  }
}
