import {Injectable, OnDestroy} from '@angular/core';
import {UserContext} from "../../../shared/services/auth/user-context";
import {SessionContext} from "../../../shared/services/auth/session-context";
import {Observable, shareReplay, take} from 'rxjs';
import {Role, User} from 'src/app/shared/models/user/user.model';
import {ComponentStore} from "@ngrx/component-store";
import {LocalStorageSsoConstants} from "../../../shared/constants/local-storage.constants";
import {filter, map} from "rxjs/operators";
import {JwtHelper} from "../../../shared/utils/jwt-helper";
import {LocalStorageService} from "../../../shared/services/local-storage.service";
import {ApiTokenProviderService} from "../../../shared/services/auth/api-token-provider.service";
import {AdminIdentityService} from "../identity/admin-identity.service";
import {Router} from "@angular/router";

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

@Injectable({
  providedIn: 'any'
})
export class AdminAuthContextService implements UserContext, SessionContext, OnDestroy {
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

  constructor(
    private readonly localStorage: LocalStorageService,
    private readonly apiTokenProviderService: ApiTokenProviderService,
    private readonly adminIdentityService: AdminIdentityService,
    private readonly router: Router) {
  }

  checkAccess(): void {
    this.state.select(s => s).pipe(
      take(1)
    ).subscribe(state => {
      if (state.status === AuthStateStatus.Initial) {
        const savedIdentity = this.getSavedIdentity();
        if (savedIdentity == null) {
          this.requestCredentials();
          return;
        }

        this.setJwt(savedIdentity.refreshToken, savedIdentity.jwt);
      }
    });
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
        roles: [Role.Admin]
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
