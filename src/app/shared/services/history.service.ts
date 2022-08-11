import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  filter,
  map
} from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Candle } from '../models/history/candle.model';
import { HistoryRequest } from '../models/history/history-request.model';
import { HistoryResponse } from '../models/history/history-response.model';
import { addDaysUnix } from "src/app/shared/utils/datetime";
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { catchHttpError } from "../utils/observable-helper";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private url = environment.apiUrl + '/md/history';

  constructor(
    private readonly http: HttpClient,
    private readonly errorHandler: ErrorHandlerService
  ) { }

  getDaysOpen(instrument: InstrumentKey): Observable<Candle> {
    const request = {
      code: instrument.symbol,
      exchange: instrument.exchange,
      tf: 'D',
      from: addDaysUnix(new Date(), -14),
      to: Date.now(),
      instrumentGroup: instrument.instrumentGroup
    };

    return this.getHistory(request).pipe(
      filter((x): x is HistoryResponse => !!x),
      map(resp => {
        const [lastCandle] = resp.history.slice(-1);
        return lastCandle;
      },
    ));
  }

  getHistory(request: HistoryRequest) : Observable<HistoryResponse | null> {
    return this.http.get<HistoryResponse>(this.url, { params: { ...request } }).pipe(
      catchHttpError<HistoryResponse | null>(null, this.errorHandler)
    );
  }
}
