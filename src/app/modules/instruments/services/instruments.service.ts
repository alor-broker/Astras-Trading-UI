import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
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

@Injectable({
  providedIn: 'root'
})
export class InstrumentsService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);
  private readonly cacheService = inject(CacheService);

  private readonly url = this.environmentService.apiUrl + '/md/v2/Securities';

  getInstrument(instrument: InstrumentKey): Observable<Instrument | null> {
    const params: Record<string, string> = {};
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
          pricestep: r.pricestep,
          lotsize: r.lotsize,
          cfiCode: r.cfiCode,
          type: r.type,
          marginbuy: r.marginbuy,
          marginsell: r.marginsell,
          expirationDate: r.cancellation,
          tradingStatus: r.tradingStatus,
          market: r.market
        };
        return selected;
      }),
      catchHttpError<Instrument | null>(null, this.errorHandlerService),
    );

    return this.cacheService.wrap(
      () => `getInstrument_${instrument.exchange}_${instrument.symbol}_${instrument.instrumentGroup ?? ''}`,
      () => stream$,
      {
        expirationTimeoutSec: 60
      }
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
          minstep: r.minstep ?? 0.01,
          market: r.market
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
}
