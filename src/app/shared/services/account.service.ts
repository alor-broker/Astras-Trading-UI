import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user/user.model';
import { map } from 'rxjs/operators';
import { Login } from '../models/user/login.model';
import { RefreshToken } from '../models/user/refresh-token.model';
import { Router } from '@angular/router';
import { Credentials } from '../models/user/credentials-model';
import { RefreshTokenResponse } from '../models/user/refresh-token-response.model';

@Injectable()
export class AccountService {
  private accountUrl = environment.clientDataUrl + '/auth/actions';
  private currentUser = new BehaviorSubject<User>({
    login: '',
    token: '',
    refreshToken: ''
  });
  private requiredServices = [
    'client',
    'Warp',
    'subscriptionsApi',
    'ServicesApi',
    'WarpATConnector',
    'CommandApi',
  ];

  currentUser$ = this.currentUser.asObservable();
  isAuthorised$ = this.currentUser$.pipe(
    map((user) => {
      return this.isAuthorised(user);
    })
  );

  constructor(private http: HttpClient, private router: Router) {
    const user: User = JSON.parse(localStorage.getItem('user')!);
    this.setCurrentUser(user);
  }

  public login(credentials: Credentials) {
    const request : Login = {
      credentials: credentials,
      requiredServices: this.requiredServices,
    };

    return this.http.post<User>(`${this.accountUrl}/login`, request).pipe(
      map((user: User) => {
        if (user) {
          user.login = credentials.username;
          localStorage.setItem('user', JSON.stringify(user));
          this.setCurrentUser(user);
        }
      })
    );
  }

  public refresh() {
    const user = this.currentUser.getValue();
    if (!user) {
      throw Error('User is empty, can\'t refresh token');
    }
    const refreshModel : RefreshToken = {
      oldJwt: user.token,
      refreshToken: user.refreshToken,
    }
    return this.http
      .post<RefreshTokenResponse>(`${this.accountUrl}/refresh`, refreshModel)
      .pipe(
        map((res: RefreshTokenResponse) => {
          if (res) {
            user.token = res.jwt;
            localStorage.setItem('user', JSON.stringify(user));
            this.setCurrentUser(user);
          }
        })
      );
  }

  public logout() {
    localStorage.removeItem('user');
    this.currentUser.next({
      login: '',
      token: '',
      refreshToken: ''
    });
  }

  public isAuthorised(user?: User): boolean {
    if (!user) {
      user = this.currentUser.getValue();
    }
    if (user && user.token) {
      return this.checkTokenTime(user.token);
    }
    return false;
  }

  public getAccessToken(): string | undefined {
    return this.currentUser.getValue().token;
  }

  private checkTokenTime(token: string | undefined): boolean {
    if (token) {
      const mainPart = token.split('.')[1];
      const decodedString = atob(mainPart);
      const expirationTime = JSON.parse(decodedString)['exp'] * 1000;
      const now = Date.now() + 1000;
      return now < expirationTime;
    }
    return false;
  }

  private setCurrentUser(user: User) {
    this.currentUser.next(user);
  }
}
