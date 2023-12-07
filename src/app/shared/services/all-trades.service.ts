import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  AllTradesFilters,
  AllTradesItem,
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
  private allTradesUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService) {
  }

  public getTradesList(req: AllTradesFilters): Observable<Array<AllTradesItem>> {
    const { exchange, symbol } = req;

    return this.http.get<Array<AllTradesItem>>(`${this.allTradesUrl}/${exchange}/${symbol}/alltrades`, {
      params: { ...req }
    })
      .pipe(
        catchHttpError<Array<AllTradesItem>>([], this.errorHandlerService),
      );
  }

  public getNewTradesSubscription(instrumentKey: InstrumentKey, depth?: number): Observable<AllTradesItem> {
    const request: AllTradesSubRequest = {
      opcode: 'AllTradesSubscribe',
      code: instrumentKey.symbol,
      exchange: instrumentKey.exchange,
      depth: depth,
      format: 'simple',
      repeatCount: depth
    };

    return this.subscriptionsDataFeedService.subscribe(
      request,
      request => `${request.opcode}_${request.code}_${request.exchange}_${depth ?? 1}`
    );
  }

}
