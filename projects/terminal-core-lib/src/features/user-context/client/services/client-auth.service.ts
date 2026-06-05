import {
  catchError,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take,
  tap,
} from 'rxjs';
import {
  DestroyRef,
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {LocalStorageService} from '@terminal-core-lib/features/local-storage/local-storage.service';
import {
  SessionContext,
  UserContext
} from "../../user-context.types";
import {
  HttpClient,
  HttpContext
} from "@angular/common/http";
import {ComponentStore} from "@ngrx/component-store";
import {
  AuthContext,
  AuthStateStatus,
  IdentityState,
  JwtState
} from "./client-auth.types";
import {
  Permission,
  Role,
  User
} from "../../user.types";
import {ApiTokenProviderService} from '@terminal-core-lib/features/http-requests/services/api-token-provider.service';
import {HttpContextTokens} from '@terminal-core-lib/features/http-requests/constants/http.constants';
import {JwtHelper} from '@terminal-core-lib/common/utils/jwt-helper';
import {catchHttpError} from '@terminal-core-lib/common/utils/observable/catch-http-error';
import {
  CLIENT_DATA_URLS_PROVIDER,
  ClientDataUrlsProvider
} from '../../../../config/api-url-providers';

import {LocalStorageSsoConstants} from '../../../local-storage/local-storage.constants';

@Injectable()
export class ClientAuthService implements UserContext, SessionContext, OnDestroy {
  private readonly clientDataUrlsProvider = inject<ClientDataUrlsProvider>(CLIENT_DATA_URLS_PROVIDER);

  private readonly httpClient = inject(HttpClient);

  private readonly localStorage = inject(LocalStorageService);

  private readonly destroyRef = inject(DestroyRef);

  private readonly apiTokenProviderService = inject(ApiTokenProviderService);

  private readonly window = inject(Window);

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

  constructor() {
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

  setRefreshToken(refreshToken: string): Observable<boolean> {
    return this.state.select(s => s).pipe(
      take(1),
      switchMap(state => {
        if (state.status === AuthStateStatus.Refreshing) {
          return this.state.select(s => s).pipe(
            filter(s => s.status !== AuthStateStatus.Refreshing),
            take(1),
            map(s => s.status === AuthStateStatus.Ready && s.state != null)
          );
        }

        if (state.status === AuthStateStatus.Exited) {
          return of(false);
        }

        this.state.patchState({
          status: AuthStateStatus.Refreshing
        });

        return this.refreshJwt(refreshToken).pipe(
          tap(s => {
            if (s == null) {
              this.state.patchState({
                status: AuthStateStatus.Exited,
                state: null
              });

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
          }),
          map(s => s != null)
        );
      })
    );
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

        return this.setRefreshToken(savedIdentity.refreshToken);
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
      ),
      takeUntilDestroyed(this.destroyRef)
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
            roles: [Role.Client],
            permissions: [
              Permission.EditOrder,
              Permission.CancelOrder,
              Permission.ClosePosition,
              Permission.ReversePosition
            ]
          },
          expirationTime: jwtBody.exp * 1000,
        } as JwtState;
      }),
      catchHttpError<JwtState | null>(null),
      take(1)
    );
  }

  private getIdentityUrl(): string {
    return this.clientDataUrlsProvider.clientDataUrl + '/auth/actions';
  }

  private saveIdentity(state: JwtState): void {
    this.localStorage.setItem<IdentityState>(
      this.ssoTokenStorageKey,
      {
        refreshToken: state.refreshToken,
        jwt: state.jwt
      }
    );
  }

  private getSavedIdentity(): IdentityState | null {
    return this.localStorage.getItem<IdentityState>(this.ssoTokenStorageKey) ?? null;
  }

  private redirectToSso(withSsoExitScreen: boolean): void {
    this.window.location.assign(
      this.clientDataUrlsProvider.ssoUrl
      + `?url=${window.location.origin}/auth/sso&scope=Astras`
      + (withSsoExitScreen ? '&exit=1' : '')
    );
  }
}
