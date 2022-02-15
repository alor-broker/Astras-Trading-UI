import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, switchMap } from 'rxjs';
import { AuthService } from 'src/app/shared/services/auth.service';
import { environment } from 'src/environments/environment';
import { FullName } from '../models/full-name.model';

@Injectable({
  providedIn: 'root'
})
export class TerminalSettingsService {
  private url = environment.apiUrl + '/client/v1.0/users'

  constructor(private http: HttpClient, private auth: AuthService) { }

  getFullName() {
    return this.auth.currentUser$.pipe(
      switchMap(u => this.http.get<FullName>(`${this.url}/${u.login}/full-name`))
    )
  }
}
