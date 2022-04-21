import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { Position } from '../models/positions/position.model';
import { environment } from 'src/environments/environment';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PositionsService {
  private readonly url: string;
  constructor(private http: HttpClient) {
    this.url = environment.apiUrl + '/md/v2/clients';
  }

  getAllByLogin(login: string) : Observable<Position[]> {
    return this.http.get<Position[]>(`${this.url}/${login}/positions`);
  }

  getAllByPortfolio(portfolio: string, exchange: string) : Observable<Position[]> {
    return this.http.get<Position[]>(`${this.url}/${portfolio}/${exchange}/positions`);
  }

  getByPortfolio(portfolio: string, exchange: string, ticker: string) : Observable<Position | null> {
    return this.http.get<Position>(`${this.url}/${exchange}/${portfolio}/positions/${ticker}`).pipe(
      catchError(() => of(null))
    );
  }
}
