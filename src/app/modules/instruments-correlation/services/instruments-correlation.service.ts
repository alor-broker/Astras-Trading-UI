import { Injectable } from '@angular/core';
import {
  CorrelationMatrix,
  InstrumentsCorrelationErrorCodes,
  InstrumentsCorrelationRequest,
  InstrumentsCorrelationResponse
} from "../models/instruments-correlation.model";
import {
  Observable,
  of,
  take
} from "rxjs";
import {
  HttpClient,
  HttpErrorResponse
} from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class InstrumentsCorrelationService {
  constructor(
    private readonly httpClient: HttpClient
  ) {
  }

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

        if ((i.instrumentGroup ?? '')) {
          parts.push(i.instrumentGroup as string);
        }

        return parts.join(':');
      }).join(',');

    return this.httpClient.get<CorrelationMatrix>(
      `${environment.apiUrl}/timeseriesanalyser/tsa`,
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
