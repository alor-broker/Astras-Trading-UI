import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  interval,
  NEVER,
  of,
  shareReplay,
  take,
} from 'rxjs';
import { environment } from 'src/environments/environment';
import { User } from '../models/user/user.model';
import {
  distinct,
  filter,
  map,
  switchMap
} from 'rxjs/operators';
import { RefreshToken } from '../models/user/refresh-token.model';
import { RefreshTokenResponse } from '../models/user/refresh-token-response.model';
import { JwtBody } from '../models/user/jwt.model';
import { BaseUser } from '../models/user/base-user.model';
import { LocalStorageService } from "./local-storage.service";
import {
  catchHttpError,
  mapWith
} from '../utils/observable-helper';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { BroadcastService } from './broadcast.service';

export const ForceLogoutMessageType = 'forceLogout';

interface UserState {
  user: User | null;
  isExited: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly userStorage = 'user';
  private readonly accountUrl = environment.clientDataUrl + '/auth/actions';
  private readonly ssoUrl = environment.ssoUrl;
  private readonly currentUserSub = new BehaviorSubject<UserState | null>(null);

  readonly currentUser$ = this.currentUserSub.asObservable().pipe(
    map(x => x?.user),
    filter((x): x is User => !!x)
  );

  readonly accessToken$ = this.currentUserSub.pipe(
    switchMap((userState, index) => {
      if (this.isAuthorised(userState?.user)) {
        if (index === 0) {
          this.refreshToken(userState!.user!);
          return NEVER;
        }
      }
      else {
        this.localStorage.removeItem(this.userStorage);
        this.redirectToSso(userState?.isExited ?? false);
        return NEVER;
      }

      return of(userState?.user);
    }),
    mapWith(() => interval(1000), (user,) => user),
    switchMap(user => {
      if (this.isAuthorised(user)) {
        return of(user);
      }

      this.refreshToken(user!);
      return NEVER;
    }),
    shareReplay(1),
    filter(user => this.isAuthorised(user)),
    map(user => user!.jwt),
    distinct()
  );

  constructor(
    private readonly http: HttpClient,
    private readonly localStorage: LocalStorageService,
    private readonly window: Window,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly broadcastService: BroadcastService
  ) {

    const user = localStorage.getItem<User>(this.userStorage);
    this.setCurrentUser({
      user: user ?? null,
      isExited: false
    });

    broadcastService.subscribe(ForceLogoutMessageType).subscribe(() => {
      this.setCurrentUser({
        user: null,
        isExited: false
      });

      this.localStorage.removeItem(this.userStorage);
    });
  }

  public setUser(baseUser: BaseUser) {
    const portfolios = this.extractPortfolios(baseUser.jwt);
    const clientId = this.extractClientId(baseUser.jwt);
    const login = this.extractUserLogin(baseUser.jwt);
    const user: User = {
      ...baseUser,
      clientId,
      portfolios,
      login
    };

    this.localStorage.setItem(this.userStorage, user);
    this.setCurrentUser({
      user: user,
      isExited: false
    });
  }

  public logout() {
    this.setCurrentUser({
      user: null,
      isExited: true
    });
  }

  public isAuthRequest(url: string) {
    return url == `${this.accountUrl}/login` || url == `${this.accountUrl}/refresh`;
  }

  private redirectToSso(isExit: boolean) {
    this.window.location.assign(this.ssoUrl + `?url=http://${window.location.host}/auth/callback&scope=Astras` + (isExit ? '&exit=1' : ''));
  }

  private isAuthorised(user?: User | null): boolean {
    if (user?.jwt) {
      return this.checkTokenTime(user.jwt);
    }
    return false;
  }

  private refreshToken(user: User) {
    const refreshModel: RefreshToken = {
      oldJwt: user.jwt,
      refreshToken: user.refreshToken,
    };

    return this.http
      .post<RefreshTokenResponse>(`${this.accountUrl}/refresh`, refreshModel).pipe(
        catchHttpError<RefreshTokenResponse | null>(null, this.errorHandlerService),
        take(1)
      )
      .subscribe(response => {
        if (response) {
          this.setUser({
            ...user,
            jwt: response.jwt
          });
        } else {
          this.localStorage.removeItem(this.userStorage);
          this.redirectToSso(false);
        }
      });
  }

  private extractPortfolios(jwt: string): string[] {
    if (jwt) {
      return this.decodeJwtBody(jwt).portfolios?.split(' ') || [];
    }
    return [];
  }

  private extractClientId(jwt: string | undefined): string {
    if (jwt) {
      let decoded = this.decodeJwtBody(jwt);
      return decoded.clientid;
    }
    return '';
  }

  private extractUserLogin(jwt: string | undefined): string {
    if (jwt) {
      return this.decodeJwtBody(jwt).sub;
    }
    return '';
  }

  private decodeJwtBody(jwt: string): JwtBody {
    const mainPart = jwt.split('.')[1];
    const decodedString = atob(mainPart);
    return JSON.parse(decodedString);
  }

  private checkTokenTime(token: string | undefined): boolean {
    if (token) {
      const expirationTime = this.decodeJwtBody(token).exp * 1000;
      const now = Date.now() + 1000;
      return now < expirationTime;
    }
    return false;
  }

  private setCurrentUser(userState: UserState) {
    this.currentUserSub.next(userState);
  }
}
