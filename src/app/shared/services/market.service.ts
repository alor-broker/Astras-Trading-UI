import { Injectable } from '@angular/core';
import { ExchangeSettings } from "../models/market-settings.model";
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  shareReplay
} from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  private settings$!: Observable<{ [exchangeName: string]: ExchangeSettings }>;

  constructor(
    private readonly http: HttpClient
  ) {
    this.settings$ = this.http.get<{ [exchangeName: string]: ExchangeSettings }>('../../../assets/marketSettings.json')
      .pipe(
        shareReplay(1)
      );
  }

  getExchangeSettings(exchange: string): Observable<ExchangeSettings> {
    return this.settings$
      .pipe(
        map(s => s[exchange])
      );
  }

  getDefaultExchange(): Observable<string | undefined> {
    return this.settings$.pipe(
      map(x => Object.keys(x).find(k => x[k].isDefault))
    );
  }
}
