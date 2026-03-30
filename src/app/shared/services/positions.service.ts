import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  take
} from 'rxjs';
import {Position, PositionResponse} from '../models/positions/position.model';
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { catchHttpError } from "../utils/observable-helper";
import { EnvironmentService } from "./environment.service";
import {map} from "rxjs/operators";
import {PortfolioItemsModelHelper} from "../utils/portfolio-item-models-helper";
import {PortfolioKey} from "../models/portfolio-key.model";

@Injectable({
  providedIn: 'root'
})
export class PositionsService {
  private readonly environmentService = inject(EnvironmentService);
  private readonly http = inject(HttpClient);
  private readonly errorHandlerService = inject(ErrorHandlerService);

  private readonly url: string;
  constructor() {
    this.url = this.environmentService.apiUrl + '/md/v2/clients';
  }

  getAllByLogin(login: string): Observable<PositionResponse[]> {
    return this.http.get<PositionResponse[]>(`${this.url}/${login}/positions`);
  }

  getAllByPortfolio(portfolio: string, exchange: string): Observable<Position[] | null> {
    const ownedPortfolio: PortfolioKey = { portfolio, exchange };
    return this.http.get<PositionResponse[]>(`${this.url}/${exchange}/${portfolio}/positions`).pipe(
      catchHttpError<PositionResponse[] | null>(null, this.errorHandlerService),
      map(r => {
        if(r == null) {
          return null;
        }

        return r.map(i => PortfolioItemsModelHelper.positionResponseToModel(i, ownedPortfolio));
      }),
      take(1)
    );
  }
}
