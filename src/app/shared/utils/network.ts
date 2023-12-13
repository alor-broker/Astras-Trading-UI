import { fromEvent, merge, Observable, of } from "rxjs";
import { map } from "rxjs/operators";
/**
 * Get's a status of user's Internet connection from brawser and converts it to observable
 */
export function isOnline$(): Observable<boolean> {
  return merge(
    of(null),
    fromEvent(window, 'online'),
    fromEvent(window, 'offline')
  ).pipe(
    map(() => navigator.onLine),
  );
}
