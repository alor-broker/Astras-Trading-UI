import { Injectable, inject } from '@angular/core';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {
  Observable,
  take
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { HttpContextTokens } from "../constants/http.constants";
import { ApiTokenProviderService } from "../services/auth/api-token-provider.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private readonly apiTokenProviderService = inject(ApiTokenProviderService);

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.context.get(HttpContextTokens.SkipAuthorization)) {
      return next.handle(req);
    }

    return this.apiTokenProviderService.getToken()
      .pipe(
        take(1),
        switchMap(
          token => {
            return next.handle(req.clone({
              setHeaders: {
                Authorization: `Bearer ${token}`
              }
            }));
          }
        ),
      );
  }
}
