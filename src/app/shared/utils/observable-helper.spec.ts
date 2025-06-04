import { HttpErrorResponse } from '@angular/common/http';
import { fakeAsync, tick } from '@angular/core/testing';
import { of, throwError, Observable } from 'rxjs';
import { ApplicationErrorHandler } from '../services/handle-error/error-handler';
import { catchHttpError, mapWith } from './observable-helper';

describe('ObservableHelper', () => {
  describe('catchHttpError', () => {
    const mockHttpError = new HttpErrorResponse({ error: 'test error', status: 500 });
    const defaultValue = 'default value';

    it('should return the default value on HttpErrorResponse', (done) => {
      throwError(() => mockHttpError)
        .pipe(catchHttpError(defaultValue))
        .subscribe((value) => {
          expect(value).toBe(defaultValue);
          done();
        });
    });

    it('should call errorHandler.handleError if provided and error is HttpErrorResponse', (done) => {
      const errorHandler = {
        handleError: jasmine.createSpy('handleError'),
      } as ApplicationErrorHandler;

      throwError(() => mockHttpError)
        .pipe(catchHttpError(defaultValue, errorHandler))
        .subscribe(() => {
          expect(errorHandler.handleError).toHaveBeenCalledWith(mockHttpError);
          done();
        });
    });

    it('should return the result of valueToReturn function on HttpErrorResponse', (done) => {
      const valueFn = (err: HttpErrorResponse): string => `Error: ${err.status}`;
      const expectedValue = `Error: ${mockHttpError.status}`;
      throwError(() => mockHttpError)
        .pipe(catchHttpError(valueFn))
        .subscribe((value) => {
          expect(value).toBe(expectedValue);
          done();
        });
    });

    it('should re-throw error if it is not an HttpErrorResponse', (done) => {
      const otherError = new Error('Some other error');
      throwError(() => otherError)
        .pipe(catchHttpError(defaultValue))
        .subscribe({
          error: (err) => {
            expect(err).toBe(otherError);
            done();
          },
        });
    });

    it('should not call errorHandler.handleError if error is not HttpErrorResponse', (done) => {
      const errorHandler = {
        handleError: jasmine.createSpy('handleError'),
      } as ApplicationErrorHandler;
      const otherError = new Error('Some other error');

      throwError(() => otherError)
        .pipe(catchHttpError(defaultValue, errorHandler))
        .subscribe({
          error: () => {
            expect(errorHandler.handleError).not.toHaveBeenCalled();
            done();
          },
        });
    });
  });

  describe('mapWith', () => {
    it('should correctly project and select the result', (done) => {
      const sourceValue = 5;
      const projectedValue = 10;
      const projectFn = (val: number): Observable<number> => of(val * 2);
      const resultSelectorFn = (source: number, output: number): string =>
        `Source: ${source}, Output: ${output}`;
      const expectedResult = `Source: ${sourceValue}, Output: ${projectedValue}`;

      of(sourceValue)
        .pipe(mapWith(projectFn, resultSelectorFn))
        .subscribe((result) => {
          expect(result).toBe(expectedResult);
          done();
        });
    });

    it('should work with different types', (done) => {
      const sourceValue = { id: 1, name: 'Test' };
      const projectedValue = 'Processed: Test';
      const projectFn = (val: { id: number, name: string }): Observable<string> =>
        of(`Processed: ${val.name}`);
      const resultSelectorFn = (
        source: { id: number, name: string },
        output: string,
      ): { originalId: number, processedName: string } => ({
        originalId: source.id,
        processedName: output,
      });
      const expectedResult = {
        originalId: sourceValue.id,
        processedName: projectedValue,
      };

      of(sourceValue)
        .pipe(mapWith(projectFn, resultSelectorFn))
        .subscribe((result) => {
          expect(result).toEqual(expectedResult);
          done();
        });
    });

    it('should handle errors from the project function', (done) => {
      const sourceValue = 5;
      const error = new Error('Projection failed');
      const projectFn = (): Observable<never> => throwError(() => error);
      const resultSelectorFn = (source: number, output: any): string =>
        `Source: ${source}, Output: ${output}`;

      of(sourceValue)
        .pipe(mapWith(projectFn, resultSelectorFn))
        .subscribe({
          error: (err) => {
            expect(err).toBe(error);
            done();
          },
        });
    });

    it('should complete when source completes', fakeAsync(() => {
      let completed = false;
      const projectFn = (val: number): Observable<number> => of(val * 2);
      const resultSelectorFn = (source: number, output: number): number => source + output;

      of(1, 2, 3)
        .pipe(mapWith(projectFn, resultSelectorFn))
        .subscribe({
          complete: () => {
            completed = true;
          },
        });

      tick();
      expect(completed).toBe(true);
    }));
  });
});
