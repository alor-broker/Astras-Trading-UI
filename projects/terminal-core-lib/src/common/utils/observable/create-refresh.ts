import {
  Observable,
  of
} from 'rxjs';
import {withRefresh} from './with-refresh';

/**
 * Creates an observable that emits a value periodically, but only when the application is active.
 * @param refreshPeriodMs - The delay in milliseconds between emissions.
 * @param isAppActive$ - An observable that indicates whether the application is active. Optional.
 * @param startDue - The time to wait before starting the refresh.
 */
export function createRefresh(
  refreshPeriodMs: number,
  isAppActive$?: Observable<boolean>,
  startDue = 0
): Observable<number> {
  return of(0).pipe(
    withRefresh(refreshPeriodMs, isAppActive$, startDue)
  );
}
