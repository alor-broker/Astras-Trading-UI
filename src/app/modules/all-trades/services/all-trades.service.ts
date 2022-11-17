import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  AllTradesItem,
  AllTradesSubRequest,
  GetAllTradesRequest
} from "../models/all-trades.model";
import {
  map,
  Observable
} from "rxjs";
import { AllTradesSettings } from "../../../shared/models/settings/all-trades-settings.model";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { sortByTimestamp } from "../utils/all-trades.utils";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { SubscriptionsDataFeedService } from '../../../shared/services/subscriptions-data-feed.service';

@Injectable({
  providedIn: 'root'
})
export class AllTradesService {
  private allTradesUrl = environment.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly subscriptionsDataFeedService: SubscriptionsDataFeedService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService) {
  }

  public getTradesList(req: GetAllTradesRequest): Observable<Array<AllTradesItem>> {
    const { from, to, take, exchange, symbol } = req;

    return this.http.get<Array<AllTradesItem>>(`${this.allTradesUrl}/${exchange}/${symbol}/alltrades`, {
      params: { from, to, take, descending: true }
    })
      .pipe(
        map(res => res.sort(sortByTimestamp)),
        catchHttpError<Array<AllTradesItem>>([], this.errorHandlerService),
      );
  }

  public subscribeToNewTrades(req: AllTradesSettings): Observable<AllTradesItem> {
    const request: AllTradesSubRequest = {
      opcode: 'AllTradesSubscribe',
      code: req.symbol,
      exchange: req.exchange,
      format: 'simple'
    };

    return this.subscriptionsDataFeedService.subscribe(
      request,
      request => `${request.opcode}_${request.code}_${request.exchange}`
    );
  }
}
