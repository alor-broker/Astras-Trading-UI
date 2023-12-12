import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ExchangeRate } from "../../modules/exchange-rate/models/exchange-rate.model";
import { EnvironmentService } from "./environment.service";

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private baseUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient
  ) {
  }

  getCurrencies(): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/currencyPairs`);
  }
}
