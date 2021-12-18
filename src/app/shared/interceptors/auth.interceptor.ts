import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { switchMap, distinct } from 'rxjs/operators'
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
        distinct(),
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
