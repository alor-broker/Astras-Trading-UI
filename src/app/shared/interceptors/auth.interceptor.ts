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

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authorize: AuthService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authorize.isAuthRequest(req.url)) {
      return next.handle(req);
    }
    return this.authorize.accessToken$
      .pipe(
        take(1),
        switchMap(
          token => {
            if (!this.authorize.isAuthorised()) {
              throw new Error('Token is somehow empty');
            }
            else {
              return next.handle(req.clone({
                setHeaders: {
                  Authorization: `Bearer ${token}`
                }
              }));
            }
          }
        ),
      );
  }
}
