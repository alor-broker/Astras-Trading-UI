import { Injectable, inject } from '@angular/core';
import { Observable, } from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import { Quote } from '../models/quotes/quote.model';
import { QuotesRequest } from '../models/quotes/quotes-request.model';
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { catchHttpError } from '../utils/observable-helper';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { HttpClient } from '@angular/common/http';
import { CacheService } from "./cache.service";
import { EnvironmentService } from "./environment.service";

@Injectable({
  providedIn: 'root'
})
export class QuotesService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly cacheService = inject(CacheService);

  getQuotes(symbol: string, exchange: string, instrumentGroup?: string | null): Observable<Quote> {
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

    if(cacheTimeoutSec == null || cacheTimeoutSec === 0) {
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
    return this.httpClient.get<Quote[]>(`${this.environmentService.apiUrl}/md/v2/Securities/${exchange}:${symbol}/quotes`).pipe(
      catchHttpError<Quote[]>([], this.errorHandlerService),
      map(quotes => quotes[0] ?? null)
    );
  }
}
