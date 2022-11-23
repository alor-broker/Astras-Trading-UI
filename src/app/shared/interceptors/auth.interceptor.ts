import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import {
  Observable,
  take
} from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private readonly authService: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authService.isAuthRequest(req.url)) {
      return next.handle(req);
    }
    return this.authService.accessToken$
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
