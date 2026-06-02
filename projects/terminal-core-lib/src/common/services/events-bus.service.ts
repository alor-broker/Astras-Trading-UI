import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  concat,
  defer,
  filter,
  from,
  Observable,
  Subject
} from 'rxjs';
import {
  Event,
  StoredEvent,
  SubscribeOptions
} from './events-bus-service.types';

@Injectable({providedIn: 'root'})
export class EventsBusService implements OnDestroy {
  private readonly events$ = new Subject<StoredEvent>();
  private readonly lastEvents = new Map<string, StoredEvent>();

  ngOnDestroy(): void {
    this.events$.complete();
    this.lastEvents.clear();
  }

  publish(event: Event): void {
    const storedEvent: StoredEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.lastEvents.set(storedEvent.key, storedEvent);
    this.events$.next(storedEvent);
  }

  subscribe(predicate: (event: StoredEvent) => boolean, options?: SubscribeOptions): Observable<StoredEvent> {
    const liveEvents$ = this.events$.pipe(
      filter(x => predicate(x))
    );

    if (options?.replayLast !== true) {
      return liveEvents$;
    }

    return defer(() => {
      const replayedEvents = Array.from(this.lastEvents.values())
        .filter(predicate)
        .sort((a, b) => a.timestamp - b.timestamp);

      return concat(from(replayedEvents), liveEvents$);
    });
  }
}
