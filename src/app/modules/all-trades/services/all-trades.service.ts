import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { environment } from "../../../../environments/environment";
import { AllTradesItem, AllTradesSubRequest, GetAllTradesRequest } from "../models/all-trades.model";
import { combineLatest, distinctUntilChanged, map, Observable, shareReplay } from "rxjs";
import { AllTradesSettings } from "../../../shared/models/settings/all-trades-settings.model";
import { DashboardService } from "../../../shared/services/dashboard.service";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { select, Store } from "@ngrx/store";
import { getSelectedInstrument } from "../../../store/instruments/instruments.selectors";
import { InstrumentIsinEqualityComparer } from "../../../shared/models/instruments/instrument.model";
import { BaseWebsocketService } from "../../../shared/services/base-websocket.service";
import { WebsocketService } from "../../../shared/services/websocket.service";
import { GuidGenerator } from "../../../shared/utils/guid";
import { sortByTimestamp } from "../utils/all-trades.utils";
import { distinct } from "rxjs/operators";
import { catchHttpError } from "../../../shared/utils/observable-helper";

@Injectable()
export class AllTradesService extends BaseWebsocketService<AllTradesSettings>{
  private allTradesUrl = environment.apiUrl + '/md/v2/Securities';

  public settings$?: Observable<AllTradesSettings>;

  constructor(
    ws: WebsocketService,
    settingsService: DashboardService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly store: Store) {
    super(ws, settingsService);
  }

  public init(guid: string): void {
    if (this.settings$) {
      return;
    }

    this.settings$ = combineLatest([
      this.store.pipe(
        select(getSelectedInstrument),
        distinctUntilChanged(InstrumentIsinEqualityComparer.equals),
      ),
      this.getSettings(guid).pipe(shareReplay())
    ]).pipe(
      map(([i, settings]) => {
        const shouldUpdate =
          settings &&
          settings.linkToActive &&
          !(
            settings.symbol == i.symbol &&
            settings.exchange == i.exchange &&
            settings.instrumentGroup == i.instrumentGroup
          );
        if (shouldUpdate) {
          this.setSettings({ ...settings, ...i });
        }
        return settings;
      }),
      distinct()
    );
  }

  public getTradesList(req: GetAllTradesRequest): Observable<Array<AllTradesItem>> {
    const {from, to, take, exchange, symbol} = req;

    return this.http.get<Array<AllTradesItem>>(`${this.allTradesUrl}/${exchange}/${symbol}/alltrades`, {
      params: {from, to, take, descending: true}
    })
      .pipe(
        map(res => res.sort(sortByTimestamp)),
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

    return this.getEntity(request);
  }

}
