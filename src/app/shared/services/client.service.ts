import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { switchMap } from 'rxjs';
import { Portfolio } from 'src/app/modules/profile/models/portfolio.model';
import { AuthService } from 'src/app/shared/services/auth.service';
import { environment } from 'src/environments/environment';
import { FullName } from '../models/user/full-name.model';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  private accountUrl = environment.clientDataUrl + '/client/v1.0';
  constructor(private http: HttpClient, private auth: AuthService) { }

  get() {
    return this.auth.currentUser$.pipe(
      switchMap(u => this.http.get<Portfolio>(`${this.accountUrl}/agreements/${u.login}/portfolios`))
    );
  }

  getFullName() {
    return this.auth.currentUser$.pipe(
      switchMap(u => this.http.get<FullName>(`${this.accountUrl}/users/${u.login}/full-name`))
    );
  }
}
