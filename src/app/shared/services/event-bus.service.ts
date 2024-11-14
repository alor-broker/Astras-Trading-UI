import {
  Injectable,
  OnDestroy
} from '@angular/core';
import {
  Observable,
  Subject
} from "rxjs";
import { filter } from "rxjs/operators";

export interface Event {
  key: string;
  payload?: unknown;
}

export interface StoredEvent extends Event {
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class EventBusService implements OnDestroy {
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
