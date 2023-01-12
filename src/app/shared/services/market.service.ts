import { Injectable } from '@angular/core';
import { ExchangeSettings } from "../models/market-settings.model";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class MarketService {

  constructor(
    private readonly http: HttpClient
  ) {
  }

  getExchangeSettings(exchange: string): Observable<ExchangeSettings> {
    return this.http.get<ExchangeSettings>('../../../assets/marketSettings.json')
      .pipe(
        map(s => (s as any)[exchange])
      );
  }
}
