import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable,  } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { Quote } from '../models/quotes/quote.model';
import { QuotesRequest } from '../models/quotes/quotes-request.model';
import { BaseResponse } from '../models/ws/base-response.model';
import { WebsocketService } from './websocket.service';

@Injectable({
  providedIn: 'root'
})
export class QuotesService {

  private quote$: Observable<Quote | null> = new Observable();
  private subGuid: string | null = null

  constructor(private ws: WebsocketService) {  }

  unsubscribe() {
    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }
  }

  generateNewGuid(request: QuotesRequest) : string {
    const group = request.instrumentGroup ? request.instrumentGroup : '';
    return request.opcode + request.code + request.exchange + group + request.format;
  }

  getQuotes(symbol: string, exchange: string, instrumentGroup?: string) {
    this.ws.connect()

    if (this.subGuid) {
      this.ws.unsubscribe(this.subGuid);
    }

    const request : QuotesRequest = {
      opcode:"QuotesSubscribe",
      code: symbol,
      exchange: exchange,
      format:"simple",
      guid: '',
      instrumentGroup: instrumentGroup
    }
    this.subGuid = this.generateNewGuid(request);
    request.guid = this.subGuid;
    this.ws.subscribe(request)

    this.quote$ = this.ws.messages$.pipe(
      filter(m => m.guid == this.subGuid),
      map(r => {
        const br = r as BaseResponse<Quote>;
        return br.data;
      })
    )
    return this.quote$;
  }
}
