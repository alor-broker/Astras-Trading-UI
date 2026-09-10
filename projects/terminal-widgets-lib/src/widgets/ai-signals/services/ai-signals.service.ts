import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {
  Observable,
  of,
  take
} from 'rxjs';
import {
  CORE_API_URL_PROVIDER,
  CoreApiUrlProvider
} from '@terminal-core-lib/config/api-url-providers';
import {ErrorHandlerService} from '@terminal-core-lib/features/errors-handler/error-handler.service';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {
  SignalBatchResult,
  SignalInstrumentKey,
  SignalInstrumentsResult
} from './ai-signals-service.types';

@Injectable({providedIn: 'root'})
export class AiSignalsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly baseUrl = `${this.coreApiUrlProvider.apiUrl}/investai`;

  getInstruments(): Observable<SignalInstrumentsResult | null> {
    return this.httpClient.get<SignalInstrumentsResult>(`${this.baseUrl}/instruments`).pipe(
      catchHttpError<SignalInstrumentsResult | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  // null means either an empty request or a suppressed HTTP error already passed to the error handler
  getLatestSignals(instruments: readonly SignalInstrumentKey[]): Observable<SignalBatchResult | null> {
    const qualifiedTickers = Array.from(new Set(
      instruments
        .map(instrument => this.toQualifiedTicker(instrument))
        .filter((ticker): ticker is string => ticker != null)
    ));

    if (qualifiedTickers.length === 0) {
      return of(null);
    }

    return this.httpClient.get<SignalBatchResult>(
      `${this.baseUrl}/signals/latest`,
      {
        params: {
          tickers: qualifiedTickers.join(',')
        }
      }
    ).pipe(
      catchHttpError<SignalBatchResult | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  private toQualifiedTicker(instrument: SignalInstrumentKey): string | null {
    const exchange = instrument.exchange.trim().toUpperCase();
    const ticker = instrument.ticker.trim().toUpperCase();

    if (exchange.length === 0 || ticker.length === 0 || exchange.includes(':') || ticker.includes(':')) {
      return null;
    }

    return `${exchange}:${ticker}`;
  }
}
