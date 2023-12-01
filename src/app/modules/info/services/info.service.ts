import {
  HttpClient,
  HttpErrorResponse
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  map,
  Observable, of,
  shareReplay,
  switchMap
} from 'rxjs';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { environment } from 'src/environments/environment';
import { Calendar } from '../models/calendar.model';
import { Description } from '../models/description.model';
import { Dividend } from '../models/dividend.model';
import { ExchangeInfo } from '../models/exchange-info.model';
import { Finance } from '../models/finance.model';
import { Issue } from '../models/issue.model';
import { catchHttpError, mapWith } from '../../../shared/utils/observable-helper';
import { catchError, distinct } from 'rxjs/operators';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';
import { WidgetSettingsService } from "../../../shared/services/widget-settings.service";
import { MarketService } from "../../../shared/services/market.service";
import { InfoSettings } from '../models/info-settings.model';
import { RisksInfo } from "../models/risks.model";
import { InstrumentsService } from "../../instruments/services/instruments.service";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import { ApplicationErrorHandler } from "../../../shared/services/handle-error/error-handler";

interface SettingsWithExchangeInfo {
  settings: InfoSettings,
  info: ExchangeInfo
}

@Injectable()
export class InfoService {
  private instrumentUrl = environment.apiUrl + '/instruments/v1';
  private clientsRiskUrl = environment.apiUrl + '/commandapi/warptrans/FX1/v2/client/orders/clientsRisk';

  private settings$?: Observable<SettingsWithExchangeInfo>;

  constructor(
    private readonly settingsService: WidgetSettingsService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly marketService: MarketService,
    private readonly instrumentsService: InstrumentsService
  ) {
  }

  init(guid: string) {
    if (this.settings$) {
      return;
    }

    const getExchangeInfo = (settings: InfoSettings) => {
      return this.getExchangeInfoReq({
        symbol: settings.symbol,
        exchange: settings.exchange,
        instrumentGroup: settings.instrumentGroup
      }).pipe(
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
      mapWith(
        (s) => this.marketService.getExchangeSettings(s.info.exchange),
        (s, es) => ({s, es})
      ),
      map(({s, es}) => ({
        ...s.info,
        exchangeSettings: es
      })),
      distinct()
    );
  }

  getRisksInfo(portfolio: PortfolioKey): Observable<RisksInfo | null> {
    if (!this.settings$) {
      throw Error('Was not initialised');
    }

    const errorHandler: ApplicationErrorHandler = {
      handleError: error => {
        if (error instanceof HttpErrorResponse) {
          if(error.status === 404) {
            return;
          }
        }

        this.errorHandlerService.handleError(error);
      }
    };

    return this.settings$!.pipe(
      switchMap(settings => this.http.get<RisksInfo>(this.clientsRiskUrl, {
        params: {
          portfolio: portfolio.portfolio,
          ticker: settings.info.symbol,
          exchange: settings.info.exchange
        }
      })),
      catchHttpError<RisksInfo | null>(null, errorHandler)
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
        map(r => {
          return r.map(i => ({
            ...i,
            recordDate: new Date(i.recordDate)
          }));
        }),
        catchError(() => of([])),
      );
  }

  private getInstrumentEntity<T>(exchangeInfo: ExchangeInfo, path: string): Observable<T> {
    return this.marketService.getExchangeSettings(exchangeInfo.exchange)
      .pipe(
        switchMap(exchangeSettings => {
          let identifier = exchangeInfo.symbol;
          return this.http.get<T>(
            this.instrumentUrl +
            (exchangeSettings.isInternational ? "/international/" : "/") +
            `${identifier}/` +
            path);
        })
      );
  }

  private getExchangeInfoReq(key: InstrumentKey): Observable<ExchangeInfo> {
    return this.instrumentsService.getInstrument(key)
      .pipe(
        map(r => {
          if (!r) {
            return {} as ExchangeInfo;
          }

          const info: ExchangeInfo = {
            symbol: r.symbol,
            shortName: r.shortName,
            exchange: r.exchange,
            description: r.description,
            instrumentGroup: r.instrumentGroup,
            isin: r.isin ?? '',
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
