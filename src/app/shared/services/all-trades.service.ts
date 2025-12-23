import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  AllTradesFilters,
  AllTradesItem,
  AllTradesPagination,
  AllTradesSort,
  AllTradesSubRequest
} from "../models/all-trades.model";
import { Observable } from "rxjs";
import { SubscriptionsDataFeedService } from './subscriptions-data-feed.service';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { InstrumentKey } from '../models/instruments/instrument-key.model';
import { catchHttpError } from '../utils/observable-helper';
import { EnvironmentService } from "./environment.service";

@Injectable({
  providedIn: 'root'
})
export class AllTradesService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly subscriptionsDataFeedService = inject(SubscriptionsDataFeedService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly allTradesUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  public getTradesList(
    instrumentKey: InstrumentKey,
    filters?: AllTradesFilters,
    pagination?: AllTradesPagination,
    sort?: AllTradesSort
  ): Observable<AllTradesItem[]> {
    const params: Record<string, string | number | boolean> = {
      ...filters,
      ...pagination,
      ...sort
    };

    if (instrumentKey.instrumentGroup != null && instrumentKey.instrumentGroup.length > 0) {
      params.instrumentGroup = instrumentKey.instrumentGroup;
    }

    return this.http.get<AllTradesItem[]>(`${this.allTradesUrl}/${instrumentKey.exchange}/${instrumentKey.symbol}/alltrades`, {
      params
    })
      .pipe(
        catchHttpError<AllTradesItem[]>([], this.errorHandlerService)
      );
  }

  public getNewTradesSubscription(instrumentKey: InstrumentKey, depth?: number): Observable<AllTradesItem> {
    const request: AllTradesSubRequest = {
      opcode: 'AllTradesSubscribe',
      code: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      instrumentGroup: instrumentKey.instrumentGroup ?? '',
      depth: depth,
      format: 'simple',
      repeatCount: depth
    };

    return this.subscriptionsDataFeedService.subscribe(
      request,
      request => `${request.opcode}_${request.code}_${request.exchange}_${request.instrumentGroup}_${depth ?? 1}`
    );
  }
}
