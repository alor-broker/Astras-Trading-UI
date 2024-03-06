import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {InstrumentOptions, OptionDetails, OptionSide} from "../models/option-board.model";
import {Observable, take} from "rxjs";
import {ErrorHandlerService} from "../../../shared/services/handle-error/error-handler.service";
import {catchHttpError} from "../../../shared/utils/observable-helper";
import {map} from "rxjs/operators";
import {CacheService} from "../../../shared/services/cache.service";
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
          expirationDate: new Date(response.expirationDate),
          id: response.symbol
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
}
