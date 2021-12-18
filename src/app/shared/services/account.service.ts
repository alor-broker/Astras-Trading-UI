import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user/user.model';
import { catchError, map, mergeMap } from 'rxjs/operators';
import { Login } from '../models/user/login.model';
import { RefreshToken } from '../models/user/refresh-token.model';
import { Router } from '@angular/router';
import { Credentials } from '../models/user/credentials-model';
import { RefreshTokenResponse } from '../models/user/refresh-token-response.model';

@Injectable({
  providedIn: 'root',
})
export class AccountService {
  private accountUrl = environment.clientDataUrl + '/auth/actions';
  private ssoUrl = environment.ssoUrl;
  private currentUser = new BehaviorSubject<User>({
    login: '',
    jwt: '',
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
  accessToken$ = this.getAccessToken();

  constructor(private http: HttpClient, private router: Router) {
    const user: User = JSON.parse(localStorage.getItem('user')!);
    this.setCurrentUser(user);
  }

  public setUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
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
          user.login = credentials.login;
          this.setUser(user);
        }
      })
    );
  }

  public logout() {
    localStorage.removeItem('user');
    this.currentUser.next({
      login: '',
      jwt: '',
      refreshToken: ''
    });
  }

  public isAuthorised(user?: User): boolean {
    if (!user) {
      user = this.currentUser.getValue();
    }
    if (user && user.jwt) {
      return this.checkTokenTime(user.jwt);
    }
    return false;
  }

  public isAuthRequest(url: string) {
    return url == `${this.accountUrl}/login` || url == `${this.accountUrl}/refresh`;
  }

  private refresh() {
    const user = this.currentUser.getValue();
    if (!user) {
      this.redirectToSso();
      throw Error('User is empty, can\'t refresh token');
    }
    const refreshModel : RefreshToken = {
      oldJwt: user.jwt,
      refreshToken: user.refreshToken,
    }
    return this.http
      .post<RefreshTokenResponse>(`${this.accountUrl}/refresh`, refreshModel)
      .pipe(
        map((res: RefreshTokenResponse) => {
          if (res) {
            user.jwt = res.jwt;
            localStorage.setItem('user', JSON.stringify(user));
            this.setCurrentUser(user);
            return user.jwt;
          }
          throw Error('Can\'t refresh token');
        })
      );
  }

  private getAccessToken(): Observable<string> {
    return this.currentUser$.pipe(
      mergeMap(user => {
        if (this.isAuthorised(user)) {
          return of(user.jwt)
        }
        else {
          return this.refresh().pipe(
            map(t => t),
            catchError(e => {
              console.log(e);
              this.redirectToSso();
              throw e;
            })
          )
        }
      })
    )
  }

  private redirectToSso() {
    window.location.assign(this.ssoUrl + `?url=http://${window.location.host}/auth/callback&scope=Astras`);
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
