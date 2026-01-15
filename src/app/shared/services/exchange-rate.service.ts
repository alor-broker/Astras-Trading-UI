import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import {
  Observable,
  take
} from "rxjs";
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
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);

  private readonly baseUrl = this.environmentService.apiUrl + '/md/v2/Securities';

  getCurrencyPairs(): Observable<CurrencyPair[]> {
    return this.http.get<CurrencyPair[]>(`${this.baseUrl}/currencyPairs`).pipe(
      take(1)
    );
  }
}
