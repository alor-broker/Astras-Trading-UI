import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Observable,
  take
} from 'rxjs';
import { Position } from '../models/positions/position.model';
import { ErrorHandlerService } from "./handle-error/error-handler.service";
import { catchHttpError } from "../utils/observable-helper";
import { EnvironmentService } from "./environment.service";

@Injectable({
  providedIn: 'root'
})
export class PositionsService {
  private readonly url: string;
  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly http: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService
  ) {
    this.url = this.environmentService.apiUrl + '/md/v2/clients';
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
}
