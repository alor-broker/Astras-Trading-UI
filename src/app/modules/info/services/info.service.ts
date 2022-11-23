import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  distinctUntilChanged,
  map,
  Observable, of,
  shareReplay,
  switchMap
} from 'rxjs';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { InstrumentSearchResponse } from 'src/app/shared/models/instruments/instrument-search-response.model';
import { InfoSettings } from 'src/app/shared/models/settings/info-settings.model';
import { environment } from 'src/environments/environment';
import { Calendar } from '../models/calendar.model';
import { Description } from '../models/description.model';
import { Dividend } from '../models/dividend.model';
import { ExchangeInfo } from '../models/exchange-info.model';
import { Finance } from '../models/finance.model';
import { Issue } from '../models/issue.model';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { catchError, distinct } from 'rxjs/operators';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";

interface SettingsWithExchangeInfo {
  settings: InfoSettings,
  info: ExchangeInfo
}

@Injectable()
export class InfoService {
  private securitiesUrl = environment.apiUrl + '/md/v2/Securities';
  private instrumentUrl = environment.apiUrl + '/instruments/v1';

  private settings$?: Observable<SettingsWithExchangeInfo>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService) {
  }

  init(guid: string) {
    if (this.settings$) {
      return;
    }

    const getExchangeInfo = (settings: InfoSettings) => {
      return this.getExchangeInfoReq({ symbol: settings.symbol, exchange: settings.exchange }).pipe(
        map(info => ({ settings: settings, info: info })),
        catchHttpError({ settings: settings, info: {} as ExchangeInfo }, this.errorHandlerService),
      );
    };

    this.settings$ = this.settingsService.getSettings<InfoSettings>(guid).pipe(
      switchMap(settings => getExchangeInfo(settings)),
      shareReplay()
    );
  }

  getExchangeInfo(): Observable<ExchangeInfo> {
    if (!this.settings$) {
      throw Error('Was not initialised');
    }

    return this.settings$!.pipe(
      map(s => s.info),
      distinct()
    );
  }

  getDescription(exchangeInfo: ExchangeInfo): Observable<Description | null> {
    return this.getInstrumentEntity<Description>(exchangeInfo, 'description').pipe(
      map(d => {
        if (d.securityType == 'unknown') {
          d.securityType = exchangeInfo.type;
        }

        if(d.securityType !== 'stock' && d.securityType !== 'bond') {
          return {
            ...d,
            marginbuy: exchangeInfo?.marginbuy,
            marginsell: exchangeInfo?.marginsell
          };
        }

        return d;
      }),
    catchError(() => of(null)),
  );
  }

  getFinance(exchangeInfo: ExchangeInfo): Observable<Finance | null> {
    return this.getInstrumentEntity<Finance>(exchangeInfo, 'finance')
      .pipe(
        catchError(() => of(null)),
      );
  }

  getCalendar(exchangeInfo: ExchangeInfo): Observable<Calendar | null> {
    return this.getInstrumentEntity<Calendar>(exchangeInfo, 'bond/calendar')
      .pipe(
        catchError(() => of(null)),
      );
  }

  getIssue(exchangeInfo: ExchangeInfo): Observable<Issue | null> {
    return this.getInstrumentEntity<Issue>(exchangeInfo, 'bond/issue').pipe(
      map(i => ({
        ...i
      })),
      catchError(() => of(null)),
    );
  }

  getDividends(exchangeInfo: ExchangeInfo): Observable<Dividend[]> {
    return this.getInstrumentEntity<Dividend[]>(exchangeInfo, 'stock/dividends')
      .pipe(
        catchError(() => of([])),
      );
  }

  private getInstrumentEntity<T>(exchangeInfo: ExchangeInfo, path: string): Observable<T> {
    let identifier = exchangeInfo.symbol;
    if (exchangeInfo.exchange == Exchanges.MOEX && exchangeInfo.isin) {
      identifier = exchangeInfo.isin;
    }
    return this.http.get<T>(
      this.instrumentUrl +
      (exchangeInfo.exchange == Exchanges.SPBX ? "/international/" : "/") +
      `${identifier}/` +
      path);
  }

  private getExchangeInfoReq(key: InstrumentKey): Observable<ExchangeInfo> {
    return this.http.get<InstrumentSearchResponse>(`${this.securitiesUrl}/${key.exchange}/${key.symbol}`, {}).pipe(
      distinctUntilChanged((a, b) => {
        return a.symbol == b.symbol && a.exchange == b.exchange;
      }),
      map(r => {
        const info: ExchangeInfo = {
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.board,
          isin: r.ISIN,
          currency: r.currency,
          type: getTypeByCfi(r.cfiCode),
          lotsize: r.lotsize ?? 1,
          marginbuy: r.marginbuy,
          marginsell: r.marginsell
        };
        return info;
      })
    );
  }
}
