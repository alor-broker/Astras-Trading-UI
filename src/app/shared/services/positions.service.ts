import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  filter,
  Observable,
  of,
  switchMap,
  take
} from 'rxjs';
import { Position } from '../models/positions/position.model';
import { environment } from 'src/environments/environment';
import { catchError } from 'rxjs/operators';
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { catchHttpError } from "../utils/observable-helper";
import { getSelectedPortfolio } from "../../store/portfolios/portfolios.selectors";
import { Store } from "@ngrx/store";
import { PortfolioKey } from "../models/portfolio-key.model";

@Injectable({
  providedIn: 'root'
})
export class PositionsService {
  private readonly url: string;
  constructor(
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly store: Store
  ) {
    this.url = environment.apiUrl + '/md/v2/clients';
  }

  getAllByLogin(login: string) : Observable<Position[]> {
    return this.http.get<Position[]>(`${this.url}/${login}/positions`);
  }

  getAllByPortfolio(portfolio: string, exchange: string) : Observable<Position[] | null> {
    return this.http.get<Position[]>(`${this.url}/${exchange}/${portfolio}/positions`).pipe(
      catchHttpError<Position[] | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  getByPortfolio(exchange: string, ticker: string) : Observable<Position | null> {
    return this.store.select(getSelectedPortfolio).pipe(
      filter((p): p is PortfolioKey => !!p),
      take(1),
      switchMap(portfolio => this.http.get<Position>(`${this.url}/${exchange}/${portfolio.portfolio}/positions/${ticker}`)),
      catchError(() => of(null))
    );
  }
}
