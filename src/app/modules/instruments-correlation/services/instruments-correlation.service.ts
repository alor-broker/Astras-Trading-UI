import { Injectable } from '@angular/core';
import {
  InstrumentsCorrelationRequest,
  InstrumentsCorrelationResponse
} from "../models/instruments-correlation.model";
import {
  Observable,
  take
} from "rxjs";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";

@Injectable({
  providedIn: 'root'
})
export class InstrumentsCorrelationService {

  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
  }

  getCorrelation(request: InstrumentsCorrelationRequest): Observable<InstrumentsCorrelationResponse | null> {
    const tickers =
      request.instruments.map(i => {
        const parts = [
          i.exchange,
          i.symbol
        ];

        if (i.instrumentGroup) {
          parts.push(i.instrumentGroup);
        }

        return parts.join(':');
      }).join(',');

    return this.httpClient.get<InstrumentsCorrelationResponse>(
      `${environment.apiUrl}/timeseriesanalyser/tsa`,
      {
        params: {
          tickers,
          days: request.days,
          'detrend_type': request.detrendType
        }
      }
    ).pipe(
      catchHttpError<InstrumentsCorrelationResponse | null>(null, this.errorHandlerService),
      take(1)
    );
  }
}
