import {
  inject,
  Injectable
} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {CacheService} from '../../../common/services/cache.service';
import {
  CORE_API_URL_PROVIDER,
  CoreApiUrlProvider
} from '../../../config/api-url-providers';
import {ErrorHandlerService} from '../../errors-handler/error-handler.service';
import {
  map,
  Observable
} from 'rxjs';
import {
  Instrument,
  InstrumentKey
} from '../../../common//types/instrument.types';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {
  Board,
  InstrumentSearchResponse,
  SearchFilter
} from './instruments-service.types';

@Injectable({providedIn: 'root'})
export class InstrumentsService {
  private readonly coreApiUrlProvider = inject<CoreApiUrlProvider>(CORE_API_URL_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly cacheService = inject(CacheService);

  getInstrument(instrument: InstrumentKey): Observable<Instrument | null> {
    const params: Record<string, string> = {};
    if (instrument.instrumentGroup != null && instrument.instrumentGroup.length > 0) {
      params["instrumentGroup"] = instrument.instrumentGroup;
    }

    const stream$ = this.httpClient.get<InstrumentSearchResponse>(`${this.coreApiUrlProvider.apiUrl}/md/v2/Securities/${instrument.exchange}/${instrument.symbol}`,
      {
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

  searchInstruments(filter: SearchFilter): Observable<Instrument[]> {
    return this.httpClient.get<InstrumentSearchResponse[]>(`${this.coreApiUrlProvider.apiUrl}/md/v2/Securities/`,
      {
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

  getInstrumentBoards(instrument: { symbol: string, exchange: string }): Observable<string[] | null> {
    return this.httpClient.get<string[]>(`${this.coreApiUrlProvider.apiUrl}/md/v2/Securities/${instrument.exchange}/${instrument.symbol}/availableBoards`).pipe(
      catchHttpError<string[] | null>(null, this.errorHandlerService),
    );
  }

  getAllBoards(): Observable<Board[] | null> {
    return this.httpClient.get<Board[]>(`${this.coreApiUrlProvider.apiUrl}/md/v2/boards`).pipe(
      catchHttpError<Board[] | null>(null, this.errorHandlerService),
    );
  }
}
