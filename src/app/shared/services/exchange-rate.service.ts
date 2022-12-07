import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { ExchangeRate } from "../../modules/exchange-rate/models/exchange-rate.model";
import { environment } from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class ExchangeRateService {
  private baseUrl = environment.apiUrl + '/md/v2/Securities';

  constructor(
    private http: HttpClient
  ) {
  }

  getCurrencies(): Observable<ExchangeRate[]> {
    return this.http.get<ExchangeRate[]>(`${this.baseUrl}/currencyPairs`);
  }
}
