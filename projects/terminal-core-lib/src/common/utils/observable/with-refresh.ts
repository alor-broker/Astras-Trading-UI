import {
  EMPTY,
  MonoTypeOperatorFunction,
  Observable,
  of,
  switchMap,
  timer
} from 'rxjs';

/**
 * Repeats the source observable sequence with a given delay, but only when the application is active.
 * @param refreshPeriodMs - The delay in milliseconds between repetitions.
 * @param isAppActive$ - An observable that indicates whether the application is active. Optional, defaults to true.
 * @param startDue - The time to wait before starting the refresh.
 */
export function withRefresh<T>(
  refreshPeriodMs: number,
  isAppActive$?: Observable<boolean>,
  startDue = 0
): MonoTypeOperatorFunction<T> {
  return (source$: Observable<T>) => {
    const isActive$ = isAppActive$ ?? of(true);

    return isActive$.pipe(
      switchMap(isActive => {
        if (!isActive) {
          return EMPTY;
        }

        return timer(startDue, refreshPeriodMs).pipe(
          switchMap(() => source$)
        );
      })
    );
  };
}
