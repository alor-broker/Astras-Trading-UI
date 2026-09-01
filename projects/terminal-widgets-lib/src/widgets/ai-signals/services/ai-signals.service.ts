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
import {SignalBatchResult} from './ai-signals-service.types';

@Injectable({providedIn: 'root'})
export class AiSignalsService {
  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly baseUrl = `${this.coreApiUrlProvider.apiUrl}/investai`;

  // null means either an empty request or a suppressed HTTP error already passed to the error handler
  getLatestSignals(tickers: string[]): Observable<SignalBatchResult | null> {
    const normalizedTickers = Array.from(new Set(
      tickers
        .map(ticker => ticker.trim().toUpperCase())
        .filter(ticker => ticker.length > 0)
    ));

    if (normalizedTickers.length === 0) {
      return of(null);
    }

    return this.httpClient.get<SignalBatchResult>(
      `${this.baseUrl}/signals/latest`,
      {
        params: {
          tickers: normalizedTickers.join(',')
        }
      }
    ).pipe(
      catchHttpError<SignalBatchResult | null>(null, this.errorHandlerService),
      take(1)
    );
  }
}
