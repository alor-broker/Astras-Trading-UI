import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { Trade } from "../models/trades/trade.model";
import { environment } from "../../../environments/environment";
import { catchHttpError } from "../utils/observable-helper";
import { map } from "rxjs/operators";
import { ErrorHandlerService } from "./handle-error/error-handler.service";

@Injectable({
  providedIn: 'root'
})
export class TradesHistoryService {

  constructor(
    private readonly httpClient: HttpClient,
    private readonly errorHandler: ErrorHandlerService
  ) {
  }

  getTradesHistoryForPortfolio(exchange: string, portfolio: string, options?: Partial<{
    from: string | null;
    limit: number | null;
  }>): Observable<Trade[] | null> {
    let params: { [propName: string]: any } = {
      descending: true
    };

    if (options) {
      if (options.limit != null) {
        params.limit = options.limit;
      }

      if (options.from ?? '') {
        params.from = options.from;
      }
    }
    return this.httpClient.get<Trade[]>(
      `${environment.apiUrl}/md/stats/${exchange}/${portfolio}/history/trades`,
      {
        params
      }
    ).pipe(
      catchHttpError<Trade[] | null>(null, this.errorHandler),
      map(trades => {
        if (!trades) {
          return trades;
        }

        return trades.map(t => ({
          ...t,
          date: new Date(t.date)
        }));
      })
    );
  }

  getTradesHistoryForSymbol(exchange: string, portfolio: string, symbol: string, options?: Partial<{
    from: string | null;
    limit: number | null;
  }>): Observable<Trade[] | null> {
    let params: { [propName: string]: any } = {
      descending: true
    };

    if (options) {
      if (options.limit != null) {
        params.limit = options.limit;
      }

      if (options.from ?? '') {
        params.from = options.from;
      }
    }
    return this.httpClient.get<Trade[]>(
      `${environment.apiUrl}/md/stats/${exchange}/${portfolio}/history/trades/${symbol}`,
      {
        params
      }
    ).pipe(
      catchHttpError<Trade[] | null>(null, this.errorHandler),
      map(trades => {
        if (!trades) {
          return trades;
        }

        return trades.map(t => ({
          ...t,
          date: new Date(t.date)
        }));
      })
    );
  }
}
