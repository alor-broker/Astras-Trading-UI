import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest, distinctUntilChanged, map, Observable, shareReplay, switchMap } from 'rxjs';
import { Exchanges } from 'src/app/shared/models/enums/exchanges';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { InstrumentSearchResponse } from 'src/app/shared/models/instruments/instrument-search-response.model';
import { InfoSettings } from 'src/app/shared/models/settings/info-settings.model';
import { BaseService } from 'src/app/shared/services/base.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { environment } from 'src/environments/environment';
import { Calendar } from '../models/calendar.model';
import { Description } from '../models/description.model';
import { Dividend } from '../models/dividend.model';
import { ExchangeInfo } from '../models/exchange-info.model';
import { Finance } from '../models/finance.model';
import { Issue } from '../models/issue.model';
import { getSelectedInstrument } from '../../../store/instruments/instruments.selectors';
import { InstrumentIsinEqualityComparer } from '../../../shared/models/instruments/instrument.model';
import { catchHttpError } from '../../../shared/utils/observable-helper';
import { distinct } from 'rxjs/operators';
import { ErrorHandlerService } from '../../../shared/services/handle-error/error-handler.service';
import { getTypeByCfi } from 'src/app/shared/utils/instruments';

interface SettingsWithExchangeInfo {
  settings: InfoSettings,
  info: ExchangeInfo
}

@Injectable()
export class InfoService extends BaseService<InfoSettings>{
  private securitiesUrl = environment.apiUrl + '/md/v2/Securities';
  private instrumentUrl = environment.apiUrl + '/instruments/v1';

  private settings$?: Observable<SettingsWithExchangeInfo>;

  constructor(
    settingsService: DashboardService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly store: Store) {
    super(settingsService);
  }

  init(guid: string) {
    if (this.settings$) {
      return;
    }

    this.settings$ = combineLatest([
      this.store.pipe(
        select(getSelectedInstrument),
        distinctUntilChanged(InstrumentIsinEqualityComparer.equals),
      ),
      this.getSettings(guid).pipe(
        switchMap(s => {
          return this.getExchangeInfoReq({ symbol: s.symbol, exchange: s.exchange }).pipe(
            map(ei => ({ settings: s, info: ei })),
            catchHttpError(
              { settings: s, info: {} as ExchangeInfo },
              this.errorHandlerService)
          );
        }),
        shareReplay()
      )
    ]).pipe(
      map(([i, settings]) => {
        const shouldUpdate =
          settings &&
          settings.settings.linkToActive &&
          !(
            settings.settings.symbol == i.symbol &&
            settings.settings.exchange == i.exchange &&
            settings.settings.instrumentGroup == i.instrumentGroup
          );
        if (shouldUpdate) {
          this.setSettings({ ...settings.settings, ...i });
        }
        return settings;
      })
    );
  }

  getExchangeInfo() : Observable<ExchangeInfo> {
    if(!this.settings$) {
      throw Error('Was not initialised');
    }

    return this.settings$!.pipe(
      map(s => s.info),
      distinct()
    );
  }

  getDescription(exchangeInfo: ExchangeInfo) : Observable<Description> {
    return this.getInstrumentEntity<Description>(exchangeInfo, 'description').pipe(
      map(d => {
        if (d.securityType == 'unknown') {
          d.securityType = exchangeInfo.type;
        }
        return d;
      })
    );
  }

  getFinance(exchangeInfo: ExchangeInfo) : Observable<Finance> {
    return this.getInstrumentEntity<Finance>(exchangeInfo,'finance');
  }

  getCalendar(exchangeInfo: ExchangeInfo) : Observable<Calendar> {
    return this.getInstrumentEntity<Calendar>(exchangeInfo,'bond/calendar');
  }

  getIssue(exchangeInfo: ExchangeInfo) : Observable<Issue> {
    return this.getInstrumentEntity<Issue>(exchangeInfo,'bond/issue').pipe(
      map(i => ({
        ...i
      }))
    );
  }

  getDividends(exchangeInfo: ExchangeInfo) : Observable<Dividend[]> {
    return this.getInstrumentEntity<Dividend[]>(exchangeInfo,'stock/dividends');
  }

  private getInstrumentEntity<T>(exchangeInfo: ExchangeInfo, path: string) : Observable<T> {
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
    return this.http.get<InstrumentSearchResponse>(`${this.securitiesUrl}/${key.exchange}/${key.symbol}`, {
     }).pipe(
      distinctUntilChanged((a, b) => {
        return a.symbol == b.symbol && a.exchange == b.exchange;
      }),
      map(r => {
        const info : ExchangeInfo = {
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.board,
          isin: r.ISIN,
          currency: r.currency,
          type: getTypeByCfi(r.cfiCode),
          lotsize: r.lotsize ?? 1
        };
        return info;
      })
    );
  }
}
