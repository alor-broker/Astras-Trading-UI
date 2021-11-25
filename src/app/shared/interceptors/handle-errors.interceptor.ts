import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HandleErrorService } from '../services/handle-error.service';

@Injectable({
  providedIn: 'root',
})
export class HandleErrorsInterceptor implements HttpInterceptor {
  constructor(private errorService: HandleErrorService) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    return next.handle(req)
    .pipe(catchError(
      (error: HttpErrorResponse) : Observable<any> => {
        this.errorService.handleError(error);
        return throwError(error);
      }
    ));
  }
}
