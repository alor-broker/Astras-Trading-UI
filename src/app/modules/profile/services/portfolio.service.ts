import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { Portfolio } from '../models/portfolio.model';
import { ProfileModule } from '../profile.module';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {

  private accountUrl = environment.clientDataUrl + '/client/v1.0';
  constructor(private http: HttpClient) { }

  get() {
    const response = this.http.get<Portfolio>(`${this.accountUrl}/agreements/39004/portfolios/D39004`);
    return response;
  }
}
