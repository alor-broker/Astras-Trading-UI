import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpContext,
  HttpErrorResponse
} from "@angular/common/http";
import {
  LoginRequest,
  LoginResponse,
  LoginResult,
  LoginStatus,
  RefreshResponse
} from "./admin-identity-service.models";
import {
  Observable,
  of,
  take
} from "rxjs";
import { environment } from "../../../../environments/environment";
import { HttpContextTokens } from "../../../shared/constants/http.constants";
import {
  catchError,
  map
} from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class AdminIdentityService {
  private readonly baseUrl = environment.admin.identityUrl;

  constructor(
    private readonly httpClient: HttpClient
  ) {
  }

  login(request: LoginRequest): Observable<LoginResponse | null> {
    const requiredServices = [
      'Identity',
      'ServicesApi'
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
