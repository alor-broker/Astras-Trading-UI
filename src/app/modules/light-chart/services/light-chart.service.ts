import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, flatMap, map, mergeMap } from 'rxjs/operators';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { environment } from 'src/environments/environment';
import { LightChartSettings } from '../../../shared/models/settings/light-chart-settings.model';
import { BarsRequest } from '../models/bars-request.model';
import { Candle } from '../models/candle.model';
import { HistoryRequest } from '../models/history-request.model';
import { HistoryResponse } from '../models/history-response.model';

@Injectable({
  providedIn: 'root',
})
export class LightChartService {
  private url = environment.apiUrl + '/md/history';
  private bars$: Observable<Candle> = new Observable();
  private subGuid: string | null = null;
  private settings: BehaviorSubject<LightChartSettings | null> =
    new BehaviorSubject<LightChartSettings | null>(null);
  settings$ = this.settings.asObservable();

  constructor(private ws: WebsocketService, private http: HttpClient) {}

  setSettings(settings: LightChartSettings) {
    this.settings.next(settings);
  }

  unsubscribe() {
    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }
  }

  getHistory(request: HistoryRequest) : Observable<HistoryResponse> {
    return this.http.get<HistoryResponse>(this.url, {
      params: { ...request },
    });
  }

  getBars(symbol: string, exchange: string, tf: string, from: number) {
    this.ws.connect();

    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }

    this.subGuid = GuidGenerator.newGuid();
    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: symbol,
      exchange: exchange,
      format: 'simple',
      guid: this.subGuid,
      tf: tf, //60,
      from: from, //1640172544
    };
    this.ws.subscribe(request);

    this.bars$ = this.ws.messages$.pipe(
      filter((m) => m.guid == this.subGuid),
      filter((m): m is BaseResponse<Candle> => !!m),
      map((m) => m.data)
    );
    return this.bars$;
  }
}
