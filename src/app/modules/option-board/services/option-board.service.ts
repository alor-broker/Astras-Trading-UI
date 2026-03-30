import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  InstrumentOptions,
  OptionDetails,
  OptionExpiration,
  OptionPlot,
  OptionSide
} from "../models/option-board.model";
import {
  Observable,
  take
} from "rxjs";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { map } from "rxjs/operators";
import { CacheService } from "../../../shared/services/cache.service";
import { EnvironmentService } from "../../../shared/services/environment.service";
import {
  formatISO,
  parseISO
} from "date-fns";

@Injectable({providedIn: 'root'})
export class OptionBoardService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly httpClient = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly cacheService = inject(CacheService);

  private readonly baseUrl = `${this.environmentService.apiUrl}/optionsapi/v1`;

  getInstrumentOptions(symbol: string, exchange: string, side: OptionSide): Observable<InstrumentOptions | null> {
    return this.httpClient.get<InstrumentOptions>(
      `${this.baseUrl}/options/${exchange}/${symbol}/${side}`
    ).pipe(
      catchHttpError<InstrumentOptions | null>(null, this.errorHandlerService),
      map(response => {
        if (!response) {
          return response;
        }

        return {
          ...response,
          options: response.options.map(o => ({
            ...o,
            expirationDate: new Date(o.expirationDate)
          }))
        } as InstrumentOptions;
      }),
      take(1)
    );
  }

  getOptionDetails(symbol: string, exchange: string, useCache = true): Observable<OptionDetails | null> {
    const stream$ = this.httpClient.get<OptionDetails>(
      `${this.baseUrl}/options/${exchange}/${symbol}`
    ).pipe(
      catchHttpError<OptionDetails | null>(null, this.errorHandlerService),
      map(response => {
        if (!response) {
          return response;
        }

        return {
          ...response,
          expirationDate: new Date(response.expirationDate)
        };
      }),
      take(1)
    );

    if (!useCache) {
      return stream$;
    }

    return this.cacheService.wrap(
      () => `getOptionDetails_${symbol}_${exchange}`,
      () => stream$
    );
  }

  getPlots(parameters: {
    instrumentKeys: { symbol: string, exchange: string, quantity: number }[];
    range?: number | null;
  }): Observable<OptionPlot | null> {
    const body: Record<string, any> = {
      instrumentKeys: parameters.instrumentKeys,
      range: parameters.range ?? 0.1
    };

    return this.httpClient.post<OptionPlot>(
      `${this.baseUrl}/options/plots`,
      body
    ).pipe(
      catchHttpError<OptionPlot | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  getExpirations(symbol: string, exchange: string): Observable<OptionExpiration[] | null> {
    return this.httpClient.get<OptionExpiration[]>(`${this.baseUrl}/options/expirations/${exchange}/${symbol}`)
      .pipe(
        catchHttpError<OptionExpiration[] | null>(null, this.errorHandlerService),
        map(r => {
          if(r == null) {
            return null;
          }

          return r.map(i => ({
            ...i,
            expiration: parseISO(i.expiration as unknown as string),
            symbol,
            exchange
          }));
        }),
        take(1)
      );
  }

  getOptionsByExpirationDate(
    symbol: string,
    exchange: string,
    expiration: Date,
    strikesCount: number
  ): Observable<InstrumentOptions | null> {
    return this.httpClient.get<InstrumentOptions>(
      `${this.baseUrl}/options/expiration/${exchange}/${symbol}`,
      {
        params: {
          'expiration_date': formatISO(expiration, { representation: 'date' }),
          'strikes': strikesCount
        }
      }
    ).pipe(
      catchHttpError<InstrumentOptions | null>(null, this.errorHandlerService),
      map(response => {
        if (!response) {
          return response;
        }

        return {
          ...response,
          options: response.options.map(o => ({
            ...o,
            expirationDate: new Date(o.expirationDate)
          }))
        } as InstrumentOptions;
      }),
      take(1)
    );
  }
}
