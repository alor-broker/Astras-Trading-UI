import { Injectable } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable } from 'rxjs';
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
    .pipe(
      catchError((error: HttpErrorResponse) : Observable<any> => {
        if (error.status != 404) {
          this.errorService.handleError(error);
        }
        throw error;
      }
    ));
  }
}
