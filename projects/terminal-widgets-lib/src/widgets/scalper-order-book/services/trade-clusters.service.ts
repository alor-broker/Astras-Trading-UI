import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  Observable,
  take
} from 'rxjs';
import {map} from 'rxjs/operators';
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {
  SubscriptionRequest,
  SubscriptionsDataFeedService
} from '@terminal-core-lib/features/data-subscriptions/services/subscriptions-data-feed.service';
import {TradesCluster} from '@terminal-widgets-lib/widgets/scalper-order-book/types/trades-clusters.types';
import {ClusterTimeframe} from '@terminal-widgets-lib/widgets/scalper-order-book/widget-settings.types';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {InstrumentKey} from '@terminal-core-lib/common/types/instrument.types';
import {
  getUnixTime,
  subSeconds
} from 'date-fns';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

interface HistoryResponse {
  clusters: TradesCluster[];
}

interface ClustersSubscriptionRequest extends SubscriptionRequest {
  code: string;
  exchange: string;
  tf: ClusterTimeframe;
  format: string;
  from: number;
}

@Injectable()
export class TradeClustersService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly subscriptionsService = inject(SubscriptionsDataFeedService);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  getHistory(
    instrumentKey: InstrumentKey,
    timeframe: ClusterTimeframe,
    intervalsCount: number
  ): Observable<TradesCluster[] | null> {
    return this.httpClient.get<HistoryResponse>(
      `${this.coreApiUrlProvider.apiUrl}/md/v2/history/cluster`,
      {
        params: {
          symbol: instrumentKey.symbol,
          exchange: instrumentKey.exchange,
          instrumentGroup: instrumentKey.instrumentGroup ?? '',
          from: this.getHistoryFromPoint(timeframe, intervalsCount),
          to: getUnixTime(new Date()),
          tf: timeframe,
          format: 'simple'
        }
      }
    ).pipe(
      catchHttpError<HistoryResponse | null>(null, this.errorHandlerService),
      map(x => x?.clusters ?? null),
      take(1)
    );
  }

  getClustersSubscription(instrumentKey: InstrumentKey, timeframe: ClusterTimeframe, from: number): Observable<TradesCluster> {
    return this.subscriptionsService.subscribe<ClustersSubscriptionRequest, TradesCluster>({
        opcode: "ClustersGetAndSubscribe",
        code: instrumentKey.symbol,
        exchange: instrumentKey.exchange,
        tf: timeframe,
        format: 'Simple',
        from: from
      },
      request => `${request.opcode}_${request.code}_${request.exchange}_${request.tf}_${request.from}_${request.format}`
    );
  }

  private getHistoryFromPoint(timeframe: ClusterTimeframe, intervalsCount: number): number {
    const secondsBack = Math.round(timeframe * intervalsCount);
    return getUnixTime(subSeconds(new Date(), secondsBack));
  }
}
