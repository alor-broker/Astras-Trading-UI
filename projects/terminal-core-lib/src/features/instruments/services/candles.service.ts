import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {
  map,
  Observable,
  take
} from 'rxjs';
import {
  Candle,
  CandleRequest,
  HistoryRequest,
  HistoryResponse
} from './candles-service.types';
import {
  getUnixTime,
  subDays
} from 'date-fns';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {SubscriptionsDataFeedService} from '../../data-subscriptions/services/subscriptions-data-feed.service';
import {TimeframeValue} from '@terminal-core-lib/common/types/timeframe.types';

@Injectable({providedIn: 'root'})
export class CandlesService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

  getLastTwoDailyCandles(instrumentKey: InstrumentKey): Observable<{ cur: Candle, prev: Candle } | null> {
    return this.getHistory(
      {
        symbol: instrumentKey.symbol,
        exchange: instrumentKey.exchange,
        tf: 'D',
        from: getUnixTime(subDays(new Date(), 2)),
        to: Math.round(Date.now() / 1000),
        countBack: 2
      }
    ).pipe(
      take(1),
      map(x => {
        if (!x || x.history.length < 2) {
          return null;
        }

        const [prev, cur] = x.history.slice(-2);

        return {
          cur,
          prev
        };
      })
    );
  }

  getHistory(request: HistoryRequest): Observable<HistoryResponse | null> {
    return this.httpClient.get<HistoryResponse>(this.coreApiUrlProvider.apiUrl + '/md/v2/history', {params: {...request}}).pipe(
      catchHttpError<HistoryResponse | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  getCandleSubscription(
    instrument: InstrumentKey,
    timeFrame: TimeframeValue | string,
    fromUnixSec?: number
  ): Observable<Candle> {
    const request: CandleRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: instrument.symbol,
      exchange: instrument.exchange,
      instrumentGroup: instrument.instrumentGroup,
      format: 'simple',
      tf: timeFrame,
      from: fromUnixSec ?? getUnixTime(new Date())
    };

    return this.subscriptionsDataFeedService.subscribe<CandleRequest, Candle>(
      request,
      () => `getInstrumentLastCandle_${instrument.exchange}_${instrument.symbol}_${instrument.instrumentGroup}_${request.tf}_${request.from}_${request.format}`
    );
  }
}
