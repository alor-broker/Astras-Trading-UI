import {
  inject,
  Injectable
} from '@angular/core';
import {environment} from '../../environments/environment';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse
} from "@angular/common/http";
import {
  catchError,
  map,
  Observable,
  of,
  take
} from 'rxjs';
import {
  LoginRequest,
  LoginResponse,
  LoginResult,
  LoginStatus,
  RefreshResponse
} from "./admin-identity-service.types";
import {HttpContextTokens} from '@terminal-core-lib/features/http-requests/constants/http.constants';

@Injectable()
export class AdminIdentityService {
  private readonly httpClient = inject(HttpClient);

  private readonly baseUrl = environment.adminIdentityUrl;

  login(request: LoginRequest): Observable<LoginResponse | null> {
    const requiredServices = [
      'Identity',
      'ServicesApi',
      'Warp',
      'CommandApi',
      'InstrumentApi',
      'RiskApi',
      'Hyperion',
      'AdminComposer'
    ];

    return this.httpClient.post<LoginResult>(
      `${this.baseUrl}/identity/v5/users/employee/login`,
      {
        credentials: request,
        requiredServices,
      },
      {
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
      }
    ).pipe(
      map(r => ({
        status: LoginStatus.Success,
        result: r
      })),
      catchError(err => {
        if (err instanceof HttpErrorResponse) {
          if (err.status === 403) {
            return of({
              status: LoginStatus.WrongCredentials,
              result: null
            });
          }
        }

        return of(null);
      }),
      take(1)
    );
  }

  refresh(refreshToken: string, oldJwt: string): Observable<RefreshResponse | null> {
    return this.httpClient.post<RefreshResponse>(
      `${this.baseUrl}/identity/v5/users/employee/refresh`,
      {
        refreshToken,
        oldJwt
      },
      {
        context: new HttpContext().set(HttpContextTokens.SkipAuthorization, true)
      }
    ).pipe(
      catchError(() => of(null)),
      take(1)
    );
  }
}
