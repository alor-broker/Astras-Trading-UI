import {
  map,
  Observable,
  OperatorFunction,
  pipe,
  switchMap
} from 'rxjs';

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
