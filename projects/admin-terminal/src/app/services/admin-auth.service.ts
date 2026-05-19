import {
  inject,
  Injectable,
  OnDestroy
} from '@angular/core';
import {ApiTokenProviderService} from "@terminal-core-lib/features/http-requests/services/api-token-provider.service";
import {LocalStorageService} from "@terminal-core-lib/features/local-storage/local-storage.service";
import {
  SessionContext,
  UserContext
} from "@terminal-core-lib/features/user-context/user-context.types";
import {AdminIdentityService} from "./admin-identity.service";
import {Router} from "@angular/router";
import {ComponentStore} from "@ngrx/component-store";
import {
  AuthContext,
  AuthStateStatus,
  IdentityState,
  JwtState
} from "@terminal-core-lib/features/user-context/client/services/client-auth.types";
import {LocalStorageSsoConstants} from "@terminal-core-lib/features/local-storage/local-storage.constants";
import {
  filter,
  map,
  Observable,
  of,
  shareReplay,
  switchMap,
  take
} from "rxjs";
import {
  Role,
  User
} from "@terminal-core-lib/features/user-context/user.types";
import {JwtHelper} from "@terminal-core-lib/common/utils/jwt-helper";

@Injectable({providedIn: 'root'})
export class AdminAuthService implements UserContext, SessionContext, OnDestroy {
  private readonly localStorage = inject(LocalStorageService);

  private readonly apiTokenProviderService = inject(ApiTokenProviderService);

  private readonly adminIdentityService = inject(AdminIdentityService);

  private readonly router = inject(Router);

  private readonly state = new ComponentStore<AuthContext>({
    status: AuthStateStatus.Initial,
    state: null
  });

  private readonly ssoTokenStorageKey = LocalStorageSsoConstants.AdminTokenStorageKey;

  private readonly user$ = this.state.select(s => s)
    .pipe(
      filter(s => s.status === AuthStateStatus.Ready && s.state != null),
      map(s => s.state!.user),
      shareReplay(1)
    );

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

        this.setJwt(savedIdentity.refreshToken, savedIdentity.jwt);
        return of(true);
      })
    );
  }

  ngOnDestroy(): void {
    this.state.ngOnDestroy();
  }

  logout(): void {
    this.state.patchState({
      status: AuthStateStatus.Exited,
      state: null
    });

    this.localStorage.removeItem(this.ssoTokenStorageKey);
    this.requestCredentials();
  }

  fullLogout(): void {
    this.logout();
  }

  getUser(): Observable<User> {
    return this.user$;
  }

  setJwt(refreshToken: string, jwt: string): void {
    const jwtBody = JwtHelper.decodeJwtBody(jwt);
    const state: JwtState = {
      refreshToken,
      jwt,
      user: {
        clientId: jwtBody.clientid,
        login: jwtBody.sub,
        portfolios: (jwtBody.portfolios as string | undefined)?.split(' ') ?? [],
        roles: [Role.Admin],
        permissions: []
      },
      expirationTime: jwtBody.exp * 1000,
    };

    this.saveIdentity(state);

    this.apiTokenProviderService.clearToken();
    this.apiTokenProviderService.updateTokenState({
      token: state.jwt,
      expirationTime: state.expirationTime,
      refreshCallback: () => this.refreshJwt()
    });

    this.state.patchState({
      status: AuthStateStatus.Ready,
      state
    });
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

  private refreshJwt(): void {
    this.state.select(s => s)
      .pipe(
        take(1)
      ).subscribe(state => {
      if (state.status === AuthStateStatus.Refreshing
        || state.status === AuthStateStatus.Exited
        || state.state == null) {
        return;
      }

      this.state.patchState({
        status: AuthStateStatus.Refreshing
      });

      this.adminIdentityService.refresh(state.state.refreshToken, state.state.jwt).subscribe(result => {
        if (result == null) {
          this.requestCredentials();
          return;
        }

        this.setJwt(state.state!.refreshToken, result.jwt);
      });
    });
  }

  private requestCredentials(): void {
    this.router.navigate(['/admin/login']);
  }
}
