import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { combineLatest, map, Observable, of, Subscription, switchMap } from 'rxjs';
import { InstrumentType } from 'src/app/shared/models/enums/instrument-type.model';
import { InstrumentKey } from 'src/app/shared/models/instruments/instrument-key.model';
import { InstrumentSearchResponse } from 'src/app/shared/models/instruments/instrument-search-response.model';
import { InfoSettings } from 'src/app/shared/models/settings/info-settings.model';
import { BaseService } from 'src/app/shared/services/base.service';
import { DashboardService } from 'src/app/shared/services/dashboard.service';
import { SyncService } from 'src/app/shared/services/sync.service';
import { environment } from 'src/environments/environment';
import { Calendar } from '../models/calendar.model';
import { Description } from '../models/description.model';
import { Dividend } from '../models/dividend.model';
import { ExchangeInfo } from '../models/exchange-info.model';
import { Finance } from '../models/finance.model';
import { Issue } from '../models/issue.model';

interface SettingsWithExchangeInfo {
  settings: InfoSettings,
  info: ExchangeInfo
}

@Injectable({
  providedIn: 'root'
})
export class InfoService extends BaseService<InfoSettings>{
  private securitiesUrl = environment.apiUrl + '/md/v2/Securities';
  private instrumentUrl = environment.apiUrl + '/instruments/v1';

  private settings$?: Observable<SettingsWithExchangeInfo>
  private sub?: Subscription;

  constructor(private http: HttpClient, settingsService: DashboardService, private sync: SyncService) {
    super(settingsService)
  }

  getSettingsWithExchangeInfo(guid: string) {
    if (this.settings$) {
      return this.settings$;
    }

    this.settings$ = combineLatest([
      this.sync.selectedInstrument$,
      this.getSettings(guid).pipe(
        switchMap(s => {
          return this.getExchangeInfoReq({ symbol: s.symbol, exchange: s.exchange }).pipe(
            map(ei => ({ settings: s, info: ei }))
          );
        })
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
      )
      return this.settings$;
  }

  getExchangeInfo(guid: string) : Observable<ExchangeInfo> {
    return this.getSettingsWithExchangeInfo(guid).pipe(map(s => s.info));
  }

  getDescription() : Observable<Description> {
    // return of(description);
    return this.getInstrumentEntity<Description>('description');
  }

  getFinance() : Observable<Finance> {
    //return of(finance);
    return this.getInstrumentEntity<Finance>('finance');
  }

  getCalendar() : Observable<Calendar> {
    // return of(bondsCalendar);
    return this.getInstrumentEntity<Calendar>('bond/calendar');
  }

  getIssue() : Observable<Issue> {
    //return of(bondIssue);
    return this.getInstrumentEntity<Issue>('bond/issue');
  }

  getDividends() : Observable<Dividend[]> {
    //return of(dividends);
    return this.getInstrumentEntity<Dividend[]>('stock/dividends');
  }

  private getInstrumentEntity<T>(path: string) : Observable<T> {
    if (this.settings$) {
      return this.settings$.pipe(
        switchMap(s => this.http.get<T>(`${this.instrumentUrl}/${s.info.isin}/${path}`))
      );
    }
    throw Error('Was not initialised');
  }

  private getExchangeInfoReq(key: InstrumentKey): Observable<ExchangeInfo> {
    return this.http.get<InstrumentSearchResponse>(`${this.securitiesUrl}/${key.exchange}/${key.symbol}`, {
     }).pipe(
      map(r => {
        const info : ExchangeInfo = {
          symbol: r.symbol,
          shortName: r.shortname,
          exchange: r.exchange,
          description: r.description,
          instrumentGroup: r.board,
          isin: r.ISIN,
          currency: r.currency,
          type: this.getTypeByCfi(r.cfiCode)
        }
        return info
      })
    )
  }

  private getTypeByCfi(cfi: string | undefined) {
    if (!cfi) {
      return InstrumentType.Other;
    }
    if (cfi.startsWith('DB')) {
      return InstrumentType.Bond
    }
    else if (cfi.startsWith('E')) {
      return InstrumentType.Stock
    }
    else if (cfi.startsWith('MRC')) {
      return InstrumentType.CurrencyInstrument
    }
    else if (cfi.startsWith('F')) {
      return InstrumentType.Futures
    }
    else if (cfi.startsWith('O')) {
      return InstrumentType.Options
    }
    return InstrumentType.Other
  }
}
