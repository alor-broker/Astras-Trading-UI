import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  filter,
  Observable,
  Subject
} from 'rxjs';
import {
  Event,
  StoredEvent
} from './events-bus-service.types';

@Injectable({providedIn: 'root'})
export class EventsBusService implements OnDestroy {
  private readonly events$ = new Subject<StoredEvent>();

  ngOnDestroy(): void {
    this.events$.complete();
  }

  publish(event: Event): void {
    this.events$.next({
      ...event,
      timestamp: Date.now()
    });
  }

  subscribe(predicate: (event: StoredEvent) => boolean): Observable<StoredEvent> {
    return this.events$.pipe(
      filter(x => predicate(x))
    );
  }
}
