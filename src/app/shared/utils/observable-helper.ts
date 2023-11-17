import {
  MonoTypeOperatorFunction,
  Observable,
  of,
  OperatorFunction,
  pipe
} from 'rxjs';
import {
  catchError,
  map,
  switchMap
} from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../services/handle-error/error-handler.service';
/**
 *
 * @param valueToReturn
 * @param errorHandler
 * @returns
 */
/**
 * Allows to catch http error and provide default value.
 * @param valueToReturn - A default value that will be returned in case of error.
 * @param errorHandler - An application error handler. Can be provided to follow common error handling approach. Optional
 */
export function catchHttpError<T>(valueToReturn: T | ((err: HttpErrorResponse) => T), errorHandler?: ErrorHandlerService): MonoTypeOperatorFunction<T> {
  return pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if (!!errorHandler) {
          errorHandler.handleError(err);
        }

        if(valueToReturn instanceof Function) {
          return of(valueToReturn(err));
        }

        return of(valueToReturn);
      }

      throw err;
    })
  );
}

/**
 * Projects each source value to an Observable which is merged in the output Observable, emitting values only from the most recently projected Observable.
 * This is analog of switchMap with resultSelector deprecated parameter
 * @param project - A function that, when applied to an item emitted by the source Observable, returns an Observable.
 * @param resultSelector - A result creation function. It accepts source and output values.
 */
export function mapWith<T1, T2, R>(project: (value: T1) => Observable<T2>, resultSelector: (source: T1, output: T2) => R): OperatorFunction<T1, R> {
  return pipe(
    switchMap((a) => project(a).pipe(
        map((b) => resultSelector(a, b))
      )
    )
  );
}

