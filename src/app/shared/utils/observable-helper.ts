import { MonoTypeOperatorFunction, of, pipe } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../services/handle-error/error-handler.service';

export function catchHttpError<T>(valueToReturn: T, errorHandler?: ErrorHandlerService): MonoTypeOperatorFunction<T> {
  return pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if (!!errorHandler) {
          errorHandler.handleError(err);
        }

        return of(valueToReturn);
      }

      throw err;
    })
  );
}
