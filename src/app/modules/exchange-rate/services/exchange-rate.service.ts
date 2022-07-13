import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { ExchangeRate } from "../models/exchange-rate.model";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { Quote } from "../../../shared/models/quotes/quote.model";
import { QuotesRequest } from "../../../shared/models/quotes/quotes-request.model";
import { filter, map } from "rxjs/operators";
import { BaseResponse } from "../../../shared/models/ws/base-response.model";
import { environment } from "../../../../environments/environment";

@Injectable()
export class ExchangeRateService {
  private baseUrl = environment.apiUrl + '/md/v2/Securities';

  private guids: string[] = [];

  constructor(
    private http: HttpClient,
    private ws: WebsocketService
  ) {}

  getCurrencies(): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/currencyPairs`);
  }

  getQuotes(symbol: string, exchange: string, instrumentGroup?: string): Observable<Quote> {
      this.ws.connect();

    const request : QuotesRequest = {
      opcode:"QuotesSubscribe",
      code: symbol,
      exchange: exchange,
      format:"simple",
      guid: '',
      instrumentGroup: instrumentGroup
    };

    const guid = ExchangeRateService.generateNewGuid(request);
    request.guid = guid;
    this.guids.push(guid);

    const quote$ = this.ws.messages$.pipe(
      filter(m => m.guid == guid),
      map(r => {
        const br = r as BaseResponse<Quote>;
        return br.data;
      })
    );

    this.ws.subscribe(request);

    return quote$.pipe(
      filter((q): q is Quote => !!q)
    );
  }

  unsubscribe() {
      this.guids.forEach(guid => this.ws.unsubscribe(guid));
      this.guids = [];
  }

  private static generateNewGuid(request: QuotesRequest) : string {
    const group = request.instrumentGroup ? request.instrumentGroup : '';
    return request.opcode + request.code + request.exchange + group + request.format;
  }
}
