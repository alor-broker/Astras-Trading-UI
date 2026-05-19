import {
  inject,
  Injectable
} from '@angular/core';
import {
  Observable,
  of,
  take
} from "rxjs";
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import {map} from "rxjs/operators";
import {CORE_API_URL_PROVIDER} from '@terminal-core-lib/config/api-url-providers';
import {
  CorrelationMatrix,
  InstrumentsCorrelationErrorCodes,
  InstrumentsCorrelationRequest,
  InstrumentsCorrelationResponse
} from '@terminal-widgets-lib/widgets/instruments-correlation/types/instruments-correlation.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';

@Injectable()
export class InstrumentsCorrelationService {
  private readonly coreApiUrlProvider = inject(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  getCorrelation(request: InstrumentsCorrelationRequest): Observable<InstrumentsCorrelationResponse> {
    if (request.instruments.length === 0) {
      return of({
        errorCode: InstrumentsCorrelationErrorCodes.EmptyTickersList
      } as InstrumentsCorrelationResponse);
    }

    if (request.instruments.length < 2) {
      return of({
        errorCode: InstrumentsCorrelationErrorCodes.ShortTickersList
      } as InstrumentsCorrelationResponse);
    }

    const tickers =
      request.instruments.map(i => {
        const parts = [
          i.exchange,
          i.symbol
        ];

        if (i.instrumentGroup != null && i.instrumentGroup.length > 0) {
          parts.push(i.instrumentGroup);
        }

        return parts.join(':');
      }).join(',');

    return this.httpClient.get<CorrelationMatrix>(
      `${this.coreApiUrlProvider.apiUrl}/timeseriesanalyser/tsa`,
      {
        params: {
          tickers,
          days: request.days,
          'detrend_type': request.detrendType
        }
      }
    ).pipe(
      map(r => ({
        data: r
      } as InstrumentsCorrelationResponse)),
      catchHttpError<InstrumentsCorrelationResponse>(error => this.getError(error)),
      take(1)
    );
  }

  private getError(error: HttpErrorResponse): { errorCode: InstrumentsCorrelationErrorCodes, errorMessage?: string } {
    if (/^(\[.+\])/.test(error.error ?? '')) {
      return {
        errorCode: InstrumentsCorrelationErrorCodes.NotTradingInstruments,
        errorMessage: error.error.error as string
      };
    }

    return {
      errorCode: InstrumentsCorrelationErrorCodes.Unknown
    };
  }
}
