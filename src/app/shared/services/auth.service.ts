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
import { RefreshTokenResponse } from '../models/user/refresh-token-response.model';
import { JwtBody } from '../models/user/jwt.model';
import { LocalStorageService } from "./local-storage.service";
import {
  catchHttpError,
  mapWith
} from '../utils/observable-helper';
import { ErrorHandlerService } from './handle-error/error-handler.service';
import { BroadcastService } from './broadcast.service';

export const ForceLogoutMessageType = 'forceLogout';

interface SsoToken {
  refreshToken: string;
  jwt?: string;
}

interface UserState {
  ssoToken: SsoToken | null;
  user: User | null;
  isExited: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly ssoTokenStorageKey = 'sso';
  private readonly accountUrl = environment.clientDataUrl + '/auth/actions';
  private readonly ssoUrl = environment.ssoUrl;
  private readonly currentUserSub = new BehaviorSubject<UserState | null>(null);

  readonly currentUser$ = this.currentUserSub.asObservable().pipe(
    map(x => x?.user),
    filter((x): x is User => !!x)
  );

  readonly accessToken$ = this.currentUserSub.pipe(
    switchMap((userState, index) => {
      if(!!userState?.ssoToken?.refreshToken && !userState.ssoToken.jwt) {
        // refreshToken is set after login. Need to get jwt
        this.refreshToken(userState);
        return NEVER;
      }
      else if (this.isAuthorised(userState?.ssoToken)) {
        // token is restored. Need to refresh
        if (index === 0) {
          this.refreshToken(userState!);
          return NEVER;
        }
      }
      else {
        // user is not authorized
        this.localStorage.removeItem(this.ssoTokenStorageKey);
        this.redirectToSso(userState?.isExited ?? false);
        return NEVER;
      }

      return of(userState);
    }),
    mapWith(() => interval(1000), (userState,) => userState),
    switchMap(userState => {
      if (this.isAuthorised(userState?.ssoToken)) {
        return of(userState);
      }

      this.refreshToken(userState!);
      return NEVER;
    }),
    shareReplay(1),
    filter(userState => this.isAuthorised(userState?.ssoToken)),
    map(userState => userState!.ssoToken!.jwt!),
    distinct()
  );

  constructor(
    private readonly http: HttpClient,
    private readonly localStorage: LocalStorageService,
    private readonly window: Window,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly broadcastService: BroadcastService
  ) {

    const token = localStorage.getItem<SsoToken>(this.ssoTokenStorageKey);
    this.setCurrentUser({
      ssoToken: token ?? null,
      user: null,
      isExited: false
    });

    broadcastService.subscribe(ForceLogoutMessageType).subscribe(() => {
      this.setCurrentUser({
        ssoToken: null,
        user: null,
        isExited: false
      });

      this.localStorage.removeItem(this.ssoTokenStorageKey);
    });
  }

  setRefreshToken(token: string) {
    this.setCurrentUser({
      ssoToken: {
        refreshToken: token
      },
      user: null,
      isExited: false
    });
  }

  logout() {
    this.setCurrentUser({
      ssoToken: null,
      user: null,
      isExited: true
    });
  }

  isAuthRequest(url: string) {
    return url == `${this.accountUrl}/login` || url == `${this.accountUrl}/refresh`;
  }

  private redirectToSso(isExit: boolean) {
    this.window.location.assign(this.ssoUrl + `?url=http://${window.location.host}/auth/callback&scope=Astras` + (isExit ? '&exit=1' : ''));
  }

  private isAuthorised(ssoToken?: SsoToken | null): boolean {
    if (ssoToken?.jwt) {
      return this.checkTokenTime(ssoToken.jwt);
    }

    return false;
  }

  private refreshToken(userState: UserState) {
    this.http
      .post<RefreshTokenResponse>(
        `${this.accountUrl}/refresh`,
        {
          refreshToken: userState.ssoToken?.refreshToken
        }
      ).pipe(
        catchHttpError<RefreshTokenResponse | null>(null, this.errorHandlerService),
        take(1)
      )
      .subscribe(response => {
        if (response) {
          const jwt =  response.jwt;
          const jwtBody = this.decodeJwtBody(jwt);
          const user: User = {
            portfolios: jwtBody.portfolios?.split(' ') || [],
            clientId: jwtBody.clientid,
            login: jwtBody.sub
          };

          this.localStorage.setItem(
            this.ssoTokenStorageKey,
            {
            refreshToken: userState.ssoToken!.refreshToken,
            jwt: jwt
          } as SsoToken
          );

          this.setCurrentUser({
            ...userState,
            ssoToken: {
              ...userState.ssoToken!,
              jwt
            },
            user
          });
        } else {
          this.localStorage.removeItem(this.ssoTokenStorageKey);
          this.redirectToSso(false);
        }
      });
  }

  private decodeJwtBody(jwt: string): JwtBody {
    const mainPart = jwt.split('.')[1];
    const decodedString = atob(mainPart);
    return JSON.parse(decodedString);
  }

  private checkTokenTime(token: string | undefined): boolean {
    if (token) {
      const expirationTime = this.decodeJwtBody(token).exp * 1000;

      // need to refresh the token before it expires. See https://github.com/alor-broker/Astras-Trading-UI/issues/1367
      const timeReserveMs = 1000 * 5;
      const now = Date.now() + timeReserveMs;
      return now < expirationTime;
    }

    return false;
  }

  private setCurrentUser(userState: UserState) {
    this.currentUserSub.next(userState);
  }
}
