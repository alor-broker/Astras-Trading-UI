import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { InstrumentKey } from '../../../shared/models/instruments/instrument-key.model';
import { ClusterTimeframe } from '../models/scalper-order-book-settings.model';
import {
  Observable,
  take
} from 'rxjs';
import { TradesCluster } from '../models/trades-clusters.model';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { environment } from '../../../../environments/environment';
import {
  addSeconds,
  toUnixTime
} from '../../../shared/utils/datetime';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { map } from 'rxjs/operators';

interface HistoryResponse {
  clusters: TradesCluster[]
}

@Injectable({
  providedIn: 'root'
})
export class TradeClustersService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService) {
  }

  getHistory(
    instrumentKey: InstrumentKey,
    timeframe: ClusterTimeframe,
    intervalsCount: number
  ): Observable<TradesCluster[] | null> {
    return this.httpClient.get<HistoryResponse>(
      `${environment.apiUrl}/md/v2/history/cluster`,
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

  getHistoryFromPoint(timeframe: ClusterTimeframe, intervalsCount: number): number {
    const secondsBack = Math.round(timeframe * intervalsCount);
    return toUnixTime(addSeconds(new Date(), -secondsBack));
  }
}
