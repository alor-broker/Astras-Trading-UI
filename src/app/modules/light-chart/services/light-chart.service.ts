import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, flatMap, map, mergeMap } from 'rxjs/operators';
import { BaseResponse } from 'src/app/shared/models/ws/base-response.model';
import { WebsocketService } from 'src/app/shared/services/websocket.service';
import { GuidGenerator } from 'src/app/shared/utils/guid';
import { LightChartSettings } from '../../../shared/models/settings/light-chart-settings.model';
import { BarsRequest } from '../models/bars-request.model';
import { Candle } from '../models/candle.model';

@Injectable({
  providedIn: 'root'
})
export class LightChartService {
  private bars$: Observable<Candle> = new Observable();
  private subGuid: string | null = null
  private settings: BehaviorSubject<LightChartSettings | null> = new BehaviorSubject<LightChartSettings | null>(null);
  settings$ = this.settings.asObservable()

  constructor(private ws: WebsocketService) { }

  setSettings(settings: LightChartSettings) {
    this.settings.next(settings);
  }


  unsubscribe() {
    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }
  }

  getBars(symbol: string, exchange: string) {
    this.ws.connect()

    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }

    this.subGuid = GuidGenerator.newGuid();
    const request : BarsRequest = {
      opcode:"BarsGetAndSubscribe",
      code: symbol,
      exchange: exchange,
      format:"simple",
      guid: this.subGuid,
      tf: 60,
      from: 1640172544
    }
    this.ws.subscribe(request)

    this.bars$ = this.ws.messages$.pipe(
      filter(m => m.guid == this.subGuid),
      filter((m): m is BaseResponse<Candle> => !!m),
      map(m => m.data)
    )
    return this.bars$;
  }
}
