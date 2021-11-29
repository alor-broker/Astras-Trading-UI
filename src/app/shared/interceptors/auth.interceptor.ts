import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { mergeMap, map, tap } from 'rxjs/operators'
import { AccountService } from '../services/account.service';

@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authorize: AccountService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (this.authorize.isAuthRequest(req.url)) {
      return next.handle(req);
    }
    return this.authorize.accessToken$
      .pipe(
        mergeMap(
          token => {
            if (!this.authorize.isAuthorised()) {
              throw new Error('Token is empty');
            }
            else {
              // return processRequestWithToken(token, req, next);
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

  private processRequestWithToken(token: string | undefined, req: HttpRequest<any>, next: HttpHandler) {
    if (!!token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req);
  }
}
