/**
 *
 * @param valueToReturn
 * @param errorHandler
 * @returns
 */
import {HttpErrorResponse} from '@angular/common/http';
import {
  catchError,
  MonoTypeOperatorFunction,
  of,
  pipe
} from 'rxjs';
import {ApplicationErrorHandler} from '@terminal-core-lib/features/errors-handler/errors-handler.types';

/**
 * Allows to catch http error and provide default value.
 * @param valueToReturn - A default value that will be returned in case of error.
 * @param errorHandler - An application error handler. Can be provided to follow common error handling approach. Optional
 */
export function catchHttpError<T>(valueToReturn: T | ((err: HttpErrorResponse) => T), errorHandler?: ApplicationErrorHandler): MonoTypeOperatorFunction<T> {
  return pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if (errorHandler) {
          // status = 0 is native platform status. It means that application is inactive
          if (err.status != 0) {
            errorHandler.handleError(err);
          }
        }

        if (valueToReturn instanceof Function) {
          return of(valueToReturn(err));
        }

        return of(valueToReturn);
      }

      throw err;
    })
  );
}
