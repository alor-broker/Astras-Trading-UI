import {
  MonoTypeOperatorFunction,
  Observable,
  ObservableInput,
  ObservedValueOf,
  of,
  OperatorFunction,
  pipe
} from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
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

export function mapWith<T1, T2, R>(project: (value: T1) => Observable<T2>, resultSelector: (a: T1, b: T2) => R): OperatorFunction<T1, R> {
  return pipe(
    switchMap((a) => project(a).pipe(
        map((b) => resultSelector(a, b))
      )
    )
  );
}

