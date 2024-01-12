import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { InstrumentSearchResponse } from '../../../shared/models/instruments/instrument-search-response.model';
import { SearchFilter } from '../models/search-filter.model';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { Instrument } from 'src/app/shared/models/instruments/instrument.model';
import { CacheService } from '../../../shared/services/cache.service';
import { EnvironmentService } from "../../../shared/services/environment.service";
import { BarsRequest } from "../../light-chart/models/bars-request.model";
import { TimeframeValue } from "../../light-chart/models/light-chart.models";
import { SubscriptionsDataFeedService } from "../../../shared/services/subscriptions-data-feed.service";
import { Candle } from "../../../shared/models/history/candle.model";

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  private readonly url = this.environmentService.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly cacheService: CacheService,
    private readonly subscriptionDatafeedService: SubscriptionsDataFeedService
  ) {
  }

  getInstrument(instrument: InstrumentKey): Observable<Instrument | null> {
    const params: { [param: string]: string } = {};
    if (instrument.instrumentGroup != null && instrument.instrumentGroup.length > 0) {
      params.instrumentGroup = instrument.instrumentGroup;
    }

    const stream$ = this.http.get<InstrumentSearchResponse>(`${this.url}/${instrument.exchange}/${instrument.symbol}`, {
      params
    }).pipe(
      map(r => {
        const selected: Instrument = {
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.board ?? r.primary_board,
          isin: r.ISIN,
          currency: r.currency,
          minstep: r.minstep ?? 0.01,
          lotsize: r.lotsize,
          cfiCode: r.cfiCode,
          type: r.type,
          marginbuy: r.marginbuy,
          marginsell: r.marginsell
        };
        return selected;
      }),
      catchHttpError<Instrument | null>(null, this.errorHandlerService),
    );

    return this.cacheService.wrap(
      () => `getInstrument_${instrument.exchange}_${instrument.symbol}_${instrument.instrumentGroup ?? ''}`,
      () => stream$
    );
  }

  getInstruments(filter: SearchFilter): Observable<Instrument[]> {
    return this.http.get<InstrumentSearchResponse[]>(this.url, {
      params: {
        ...filter,
        IncludeUnknownBoards: false
      },
    }).pipe(
      catchHttpError<InstrumentSearchResponse[]>([], this.errorHandlerService),
      map(resp => {
        const selects: Instrument[] = resp.map(r => ({
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.board ?? r.primary_board,
          isin: r.ISIN,
          currency: r.currency,
          minstep: r.minstep ?? 0.01
        }));
        return selects;
      })
    );
  }

  getInstrumentBoards(instrument: { symbol: string, exchange: string }): Observable<string[]> {
    return this.http.get<string[]>(`${this.url}/${instrument.exchange}/${instrument.symbol}/availableBoards`).pipe(
      catchHttpError<string[]>([], this.errorHandlerService),
    );
  }

  getInstrumentLastCandle(instrument: InstrumentKey, timeFrame: TimeframeValue): Observable<Candle> {
    const request: BarsRequest = {
      opcode: 'BarsGetAndSubscribe',
      code: instrument.symbol,
      exchange: instrument.exchange,
      instrumentGroup: instrument.instrumentGroup,
      format: 'simple',
      tf: timeFrame,
      from: (new Date()).getTime() / 1000
    };

    return this.subscriptionDatafeedService.subscribe<BarsRequest, Candle>(
      request,
      () => `getInstrumentLastCandle_${instrument.exchange}_${instrument.symbol}_${instrument.instrumentGroup}`
    );
  }
}
