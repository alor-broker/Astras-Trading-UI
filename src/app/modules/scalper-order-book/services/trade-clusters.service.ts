import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {InstrumentKey} from '../../../shared/models/instruments/instrument-key.model';
import {ClusterTimeframe} from '../models/scalper-order-book-settings.model';
import {Observable, take} from 'rxjs';
import {TradesCluster} from '../models/trades-clusters.model';
import {ErrorHandlerService} from '../../../shared/services/handle-error/error-handler.service';
import {addSeconds, toUnixTime} from '../../../shared/utils/datetime';
import {catchHttpError} from '../../../shared/utils/observable-helper';
import {map} from 'rxjs/operators';
import {
  SubscriptionRequest,
  SubscriptionsDataFeedService
} from "../../../shared/services/subscriptions-data-feed.service";
import { EnvironmentService } from "../../../shared/services/environment.service";

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

@Injectable({
  providedIn: 'root'
})
export class TradeClustersService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly subscriptionsService = inject(SubscriptionsDataFeedService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  getHistory(
    instrumentKey: InstrumentKey,
    timeframe: ClusterTimeframe,
    intervalsCount: number
  ): Observable<TradesCluster[] | null> {
    return this.httpClient.get<HistoryResponse>(
      `${this.environmentService.apiUrl}/md/v2/history/cluster`,
      {
        params: {
          symbol: instrumentKey.symbol,
          exchange: instrumentKey.exchange,
          instrumentGroup: instrumentKey.instrumentGroup ?? '',
          from: this.getHistoryFromPoint(timeframe, intervalsCount),
          to: toUnixTime(new Date()),
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
    return toUnixTime(addSeconds(new Date(), -secondsBack));
  }
}
