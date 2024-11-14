import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { PortfolioKey } from "../../../shared/models/portfolio-key.model";
import {
  Observable,
  of,
  take
} from "rxjs";
import { EnvironmentService } from "../../../shared/services/environment.service";
import {
  catchError,
  map
} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ClientPortfolioSearchService {
  constructor(
    private readonly httpClient: HttpClient,
    private readonly environmentService: EnvironmentService
  ) {
  }

  checkPortfolioAccess(portfolio: PortfolioKey): Observable<boolean> {
    return this.httpClient.get<unknown>(
      `${this.environmentService.apiUrl}//md/v2/Clients/${portfolio.exchange}/${portfolio.portfolio}/summary`
    ).pipe(
      catchError(() => of(null)),
      map(r => r != null),
      take(1)
    );
  }
}
