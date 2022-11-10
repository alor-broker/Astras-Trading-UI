import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import {
  AllTradesFilters,
  AllTradesItem,
  AllTradesSubRequest
} from "../models/all-trades.model";
import {
  Observable
} from "rxjs";
import { AllTradesSettings } from "../../../shared/models/settings/all-trades-settings.model";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { BaseWebsocketService } from "../../../shared/services/base-websocket.service";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { GuidGenerator } from "../../../shared/utils/guid";
import { catchHttpError } from "../../../shared/utils/observable-helper";
import { finalize } from "rxjs/operators";

@Injectable()
export class AllTradesService extends BaseWebsocketService {
  private allTradesUrl = environment.apiUrl + '/md/v2/Securities';

  constructor(
    ws: WebsocketService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService) {
    super(ws);
  }

  public getTradesList(req: AllTradesFilters): Observable<Array<AllTradesItem>> {
    const { exchange, symbol } = req;

    return this.http.get<Array<AllTradesItem>>(`${this.allTradesUrl}/${exchange}/${symbol}/alltrades`, {
      params: {...req}
    })
      .pipe(
        catchHttpError<Array<AllTradesItem>>([], this.errorHandlerService),
      );
  }

  public getNewTrades(req: AllTradesSettings): Observable<AllTradesItem> {
    const request: AllTradesSubRequest = {
      opcode: 'AllTradesSubscribe',
      code: req.symbol,
      exchange: req.exchange,
      guid: GuidGenerator.newGuid(),
      format: 'simple'
    };

    return this.getEntity<AllTradesItem>(request).pipe(
      finalize(() => this.unsubscribe())
    );
  }

}
