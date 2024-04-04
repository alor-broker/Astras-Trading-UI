import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  InstrumentOptions,
  OptionDetails,
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

@Injectable()
export class OptionBoardService {
  private readonly baseUrl = `${this.environmentService.apiUrl}/optionsapi/v1`;

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly cacheService: CacheService
  ) {
  }

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
    instrumentKeys: { symbol: string, exchange: string }[];
    range?: number | null;
    selection?: { from: number, to: number } | null;
  }): Observable<OptionPlot | null> {
    const body: { [key: string]: any } = {
      instrumentKeys: parameters.instrumentKeys,
    };

    if (parameters.selection != null) {
      body.from = parameters.selection?.from;
      body.to = parameters.selection?.to;
    } else {
      body.range = parameters.range ?? 0.3;
    }

    return this.httpClient.post<OptionPlot>(
      `${this.baseUrl}/options/plots`,
      body
    ).pipe(
      catchHttpError<OptionPlot | null>(null, this.errorHandlerService),
      take(1)
    );
  }
}
