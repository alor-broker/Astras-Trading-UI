import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { EnvironmentService } from "./environment.service";

export interface CurrencyPair {
  firstCode: string;
  secondCode: string;
  symbolTom: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private readonly baseUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient
  ) {
  }

  getCurrencyPairs(): Observable<CurrencyPair[]> {
    return this.http.get<CurrencyPair[]>(`${this.baseUrl}/currencyPairs`);
  }
}
