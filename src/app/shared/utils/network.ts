import { fromEvent, merge, of } from "rxjs";
import { map } from "rxjs/operators";

export function isOnline$() {
  return merge(
    of(null),
    fromEvent(window, 'online'),
    fromEvent(window, 'offline')
  ).pipe(
    map(() => navigator.onLine),
  );
}
