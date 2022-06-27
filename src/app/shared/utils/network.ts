import { fromEvent, merge, of } from "rxjs";
import { map } from "rxjs/operators";
/**
 * Get's a status of user's Internet connection from brawser and converts it to observable
 */
export function isOnline$() {
  return merge(
    of(null),
    fromEvent(window, 'online'),
    fromEvent(window, 'offline')
  ).pipe(
    map(() => navigator.onLine),
  );
}
