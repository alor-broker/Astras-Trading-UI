import {Injectable} from '@angular/core';
import {ExchangeSettings} from "../models/market-settings.model";
import {HttpClient} from "@angular/common/http";
import {Observable, shareReplay} from "rxjs";
import {filter, map} from "rxjs/operators";

export type AllExchanges = { exchange: string, settings: ExchangeSettings }[];

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private settings$?: Observable<{ exchange: string, settings: ExchangeSettings }[]>;

  constructor(
    private readonly http: HttpClient
  ) {
  }

  getExchangeSettings(exchange: string): Observable<ExchangeSettings> {
    return this.getSettings()
      .pipe(
        map(s => s.find(x => x.exchange === exchange)?.settings),
        filter((x): x is ExchangeSettings => !!x)
      );
  }

  getAllExchanges(): Observable<{ exchange: string, settings: ExchangeSettings }[]> {
    return this.getSettings();
  }

  getDefaultExchange(): Observable<string | undefined> {
    return this.getSettings().pipe(
      map(x => x.find(ex => ex.settings.isDefault)?.exchange)
    );
  }

  private getSettings(): Observable<AllExchanges> {
    if (!this.settings$) {
      this.settings$ = this.http.get<{
        exchange: string;
        settings: ExchangeSettings;
      }[]>(
        '../../../assets/marketSettings.json',
        {
          headers: {
            "Cache-Control": "no-cache",
            "Pragma": "no-cache"
          }
        }
      )
        .pipe(
          shareReplay(1)
        );
    }

    return this.settings$;
  }
}
