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
    let headers = req.headers;
    return this.authorize.currentUser$
      .pipe(
        mergeMap(
          user => {
            if (!user.token) {
              throw new Error('Cannot send request to registered endpoint if the user is not authenticated.');
            }
            else {
              headers = headers.append('Authorization', `Bearer ${user.token}`);
              return next.handle(req.clone({
                setHeaders: {
                  Authorization: `Bearer ${user.token}`
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
