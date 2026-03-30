import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  take
} from 'rxjs';
import { map } from 'rxjs/operators';
import { Candle } from '../models/history/candle.model';
import { HistoryRequest } from '../models/history/history-request.model';
import { HistoryResponse } from '../models/history/history-response.model';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { catchHttpError } from "../utils/observable-helper";
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { EnvironmentService } from "./environment.service";
import { addDaysUnix } from "../utils/datetime";

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandler = inject(ErrorHandlerService);

  private readonly url = this.environmentService.apiUrl + '/md/v2/history';

  getLastTwoCandles(instrumentKey: InstrumentKey): Observable<{ cur: Candle, prev: Candle } | null> {
    return this.getHistory(
      {
        symbol: instrumentKey.symbol,
        exchange: instrumentKey.exchange,
        tf: 'D',
        from: addDaysUnix(new Date(), -2),
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
    return this.http.get<HistoryResponse>(this.url, { params: { ...request } }).pipe(
      catchHttpError<HistoryResponse | null>(null, this.errorHandler),
      take(1)
    );
  }
}
