import { MonoTypeOperatorFunction, of, pipe } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { LoggerService } from '../services/logger.service';
import { LoggerHelper } from './logger-helper';

export function catchHttpError<T>(valueToReturn: T, logger?: LoggerService): MonoTypeOperatorFunction<T> {
  return pipe(
    catchError(err => {
      if (err instanceof HttpErrorResponse) {
        if (!!logger) {
          LoggerHelper.logHttpError(err, logger);
        }

        return of(valueToReturn);
      }

      throw err;
    })
  );
}
