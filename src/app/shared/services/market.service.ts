import { Injectable } from '@angular/core';
import {
  ExchangeSettings,
  MarketExchange,
  MarketSettings
} from "../models/market-settings.model";
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  shareReplay
} from "rxjs";
import {
  filter,
  map
} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private settings$?: Observable<MarketSettings>;

  constructor(
    private readonly http: HttpClient
  ) {
  }

  getMarketSettings(): Observable<MarketSettings> {
    if (!this.settings$) {
      this.settings$ = this.http.get<MarketSettings>(
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

  getExchangeSettings(exchange: string): Observable<ExchangeSettings> {
    return this.getMarketSettings()
      .pipe(
        map(s => s.exchanges.find(x => x.exchange === exchange)?.settings),
        filter((x): x is ExchangeSettings => !!x)
      );
  }

  getAllExchanges(): Observable<MarketExchange[]> {
    return this.getMarketSettings().pipe(
      map(x => x.exchanges)
    );
  }

  getDefaultExchange(): Observable<string | undefined> {
    return this.getMarketSettings().pipe(
      map(x => x.exchanges.find(ex => ex.settings.isDefault)?.exchange)
    );
  }
}
