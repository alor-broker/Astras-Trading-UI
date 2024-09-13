import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from 'rxjs';
import { User } from 'src/app/shared/models/user/user.model';
import {
  catchError,
  filter,
  map
} from "rxjs/operators";
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import { ComponentStore } from "@ngrx/component-store";
import { UserContext } from "../../../shared/services/auth/user-context";
import { SessionContext } from "../../../shared/services/auth/session-context";
import { LocalStorageSsoConstants } from "../../../shared/constants/local-storage.constants";
import { EnvironmentService } from "../../../shared/services/environment.service";
import { ErrorHandlerService } from "../../../shared/services/handle-error/error-handler.service";
import { LocalStorageService } from "../../../shared/services/local-storage.service";
import { ApiTokenProviderService } from "../../../shared/services/auth/api-token-provider.service";
import { HttpContextTokens } from "../../../shared/constants/http.constants";
import { JwtHelper } from "../../../shared/utils/jwt-helper";
import { catchHttpError } from "../../../shared/utils/observable-helper";

enum AuthStateStatus {
  Initial = 'initial',
  Refreshing = 'refreshing',
  Ready = 'ready',
  Exited = 'exited'
}

interface JwtState extends IdentityState {
  expirationTime: number;
  user: User;
}

interface AuthContext {
  status: AuthStateStatus;
  state: JwtState | null;
}

interface IdentityState {
  refreshToken: string;
  jwt: string;
}

@Injectable()
export class ClientAuthContextService implements UserContext, SessionContext, OnDestroy {
  private readonly state = new ComponentStore<AuthContext>({
    status: AuthStateStatus.Initial,
    state: null
  });

  private readonly ssoTokenStorageKey = LocalStorageSsoConstants.ClientTokenStorageKey;

  private readonly user$ = this.state.select(s => s)
    .pipe(
      filter(s => s.status === AuthStateStatus.Ready && s.state != null),
      map(s => s.state!.user),
      shareReplay(1)
    );

  constructor(
    private readonly environmentService: EnvironmentService,
    private readonly httpClient: HttpClient,
    private readonly errorHandlerService: ErrorHandlerService,
    private readonly localStorage: LocalStorageService,
    private readonly apiTokenProviderService: ApiTokenProviderService,
    private readonly window: Window) {
    this.initForceLogout();
  }

  fullLogout(): void {
    this.localStorage.removeItem(this.ssoTokenStorageKey);

    this.state.select(s => s).pipe(
      take(1),
      switchMap(s => {
        if (s.state == null) {
          return of(false);
        }

        return this.httpClient.delete(`${this.getIdentityUrl()}/refresh/${s.state!.refreshToken}`);
      }),
      catchError(() => of(false))
    ).subscribe(() => {
      this.state.patchState({
        status: AuthStateStatus.Exited,
        state: null
      });

      this.redirectToSso(false);
    });
  }

  ngOnDestroy(): void {
    this.state.ngOnDestroy();
  }

  setRefreshToken(refreshToken: string): void {
    this.state.select(s => s)
      .pipe(
        take(1)
      ).subscribe(state => {
      if (state.status === AuthStateStatus.Refreshing || state.status === AuthStateStatus.Exited) {
        return;
      }

      this.state.patchState({
        status: AuthStateStatus.Refreshing
      });

      this.refreshJwt(refreshToken)
        .subscribe(s => {
          if (s == null) {
            this.requestCredentials();
            return;
          }

          this.saveIdentity(s);

          this.apiTokenProviderService.clearToken();
          this.apiTokenProviderService.updateTokenState({
            token: s.jwt,
            expirationTime: s.expirationTime,
            refreshCallback: () => this.setRefreshToken(s.refreshToken)
          });

          this.state.patchState({
            status: AuthStateStatus.Ready,
            state: s
          });
        });
    });
  }

  checkAccess(): Observable<boolean> {
    return this.state.select(s => s).pipe(
      filter(s => [AuthStateStatus.Initial, AuthStateStatus.Ready].includes(s.status)),
      take(1),
      switchMap(s => {
        if (s.status === AuthStateStatus.Ready) {
          return of(true);
        }

        const savedIdentity = this.getSavedIdentity();
        if (savedIdentity == null) {
          this.requestCredentials();
          return of(false);
        }

        this.setRefreshToken(savedIdentity.refreshToken);
        return of(true);
      })
    );
  }

  logout(): void {
    this.state.patchState({
      status: AuthStateStatus.Exited,
      state: null
    });

    this.localStorage.removeItem(this.ssoTokenStorageKey);
    this.redirectToSso(true);
  }

  /*
  ** This method is called from sso
  ** It will force logout in all opened tabs via storage event (see initForceLogout)
  */
  forceLogout(): void {
    this.localStorage.removeItem(this.ssoTokenStorageKey);
  }

  getUser(): Observable<User> {
    return this.user$;
  }

  private requestCredentials(): void {
    this.redirectToSso(false);
  }

  private initForceLogout(): void {
    this.localStorage.onOuterChange().pipe(
      filter(e =>
        // when token has been removed
        e.key === this.ssoTokenStorageKey
        && e.newValue == null
        && e.oldValue != null
      )
    ).subscribe(() => {
      this.state.patchState({
        status: AuthStateStatus.Exited,
        state: null
      });

      this.redirectToSso(false);
    });
  }

  private refreshJwt(refreshToken: string): Observable<JwtState | null> {
    return this.httpClient.post<{ jwt: string }>(
      `${this.getIdentityUrl()}/refresh`,
      {
        refreshToken
      },
      {
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
      }
    ).pipe(
      map(r => {
        const jwtBody = JwtHelper.decodeJwtBody(r.jwt);
        return {
          refreshToken,
          jwt: r.jwt,
          user: {
            clientId: jwtBody.clientid,
            login: jwtBody.sub,
            portfolios: (jwtBody.portfolios as string | undefined)?.split(' ') ?? [],
          },
          expirationTime: jwtBody.exp * 1000,
        } as JwtState;
      }),
      catchHttpError<JwtState | null>(null, this.errorHandlerService),
      take(1)
    );
  }

  private getIdentityUrl(): string {
    return this.environmentService.clientDataUrl + '/auth/actions';
  }

  private saveIdentity(state: JwtState): void {
    this.localStorage.setItem(
      this.ssoTokenStorageKey,
      {
        refreshToken: state.refreshToken,
        jwt: state.jwt
      } as IdentityState
    );
  }

  private getSavedIdentity(): IdentityState | null {
    return this.localStorage.getItem<IdentityState>(this.ssoTokenStorageKey) ?? null;
  }

  private redirectToSso(withSsoExitScreen: boolean): void {
    this.window.location.assign(
      this.environmentService.ssoUrl
      + `?url=http://${window.location.host}/auth/callback&scope=Astras`
      + (withSsoExitScreen ? '&exit=1' : '')
    );
  }
}
