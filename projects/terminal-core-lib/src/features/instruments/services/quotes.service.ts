import {
  inject,
  Injectable
} from '@angular/core';
import {CacheService} from '../../../common/services/cache.service';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {HttpClient} from '@angular/common/http';
import {CORE_API_URL_PROVIDER} from '../../../config/api-url-providers';
import {SubscriptionsDataFeedService} from '../../data-subscriptions/services/subscriptions-data-feed.service';
import {catchHttpError} from '../../../common/utils/observable/catch-http-error';
import {
  filter,
  map,
  Observable
} from 'rxjs';
import {InstrumentKey} from '../../../common/types/instrument.types';
import {
  Quote,
  QuotesRequest
} from './quotes-service.types';

@Injectable({providedIn: 'root'})
export class QuotesService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly cacheService = inject(CacheService);

  getQuotesSubscription(symbol: string, exchange: string, instrumentGroup?: string | null): Observable<Quote> {
    const request: QuotesRequest = {
      opcode: "QuotesSubscribe",
      code: symbol,
      exchange: exchange,
      format: "simple",
      instrumentGroup: instrumentGroup
    };

    return this.subscriptionsDataFeedService.subscribe<QuotesRequest, Quote>(
      request,
      () => `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${request.format}`
    ).pipe(
      filter((q: Quote | null): q is Quote => !!q)
    );
  }

  getLastPrice(instrumentKey: InstrumentKey, cacheTimeoutSec?: number): Observable<number | null> {
    const stream$ = this.getLastQuoteInfo(instrumentKey.symbol, instrumentKey.exchange).pipe(
      catchHttpError<Quote | null>(null, this.errorHandlerService),
      map(quote => {
        return quote?.last_price ?? null;
      })
    );

    if (cacheTimeoutSec == null || cacheTimeoutSec === 0) {
      return stream$;
    }

    return this.cacheService.wrap(
      () => `QuotesService_getLastPrice_${instrumentKey.exchange}_${instrumentKey.symbol}_${instrumentKey.instrumentGroup ?? ''}`,
      () => stream$,
      {
        expirationTimeoutSec: cacheTimeoutSec
      }
    );
  }

  getLastQuoteInfo(symbol: string, exchange: string): Observable<Quote | null> {
    return this.httpClient.get<Quote[]>(`${this.coreApiUrlProvider.apiUrl}/md/v2/Securities/${exchange}:${symbol}/quotes`).pipe(
      catchHttpError<Quote[]>([], this.errorHandlerService),
      map(quotes => quotes[0] ?? null)
    );
  }
}
