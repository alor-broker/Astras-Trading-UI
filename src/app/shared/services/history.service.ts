import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { Candle } from '../models/history/candle.model';
import { HistoryRequest } from '../models/history/history-request.model';
import { HistoryResponse } from '../models/history/history-response.model';
import { addDaysUnix } from "src/app/shared/utils/datetime";
import { InstrumentKey } from '../models/instruments/instrument-key.model';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {
  private url = environment.apiUrl + '/md/history';

  constructor(private http: HttpClient) { }

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
      map(resp => {
        const [lastCandle] = resp.history.slice(-1);
        return lastCandle;
      },
    ));
  }

  getHistory(request: HistoryRequest) : Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(this.url, {
      params: { ...request },
    });
  }
}
