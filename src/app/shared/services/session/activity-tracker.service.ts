import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ActivityTrackerService implements EventListenerObject {
  private readonly eventsToTrack = ['mousemove', 'scroll', 'keydown', 'touchmove'];
  private readonly lastActivityTimeSub = new BehaviorSubject<number | null>(new Date().getTime());
  public readonly lastActivityUnixTime$ = this.lastActivityTimeSub.asObservable();

  handleEvent(): void {
    this.lastActivityTimeSub.next(new Date().getTime());
  }

  startTracking(): void {
    this.clearEventListeners();
    this.setupEventListeners();
  }

  stopTracking(): void {
    this.clearEventListeners();
  }

  private setupEventListeners(): void {
    this.eventsToTrack.forEach(event => {
      window.addEventListener(event, this);
    });
  }

  private clearEventListeners(): void {
    this.eventsToTrack.forEach(event => {
      window.removeEventListener(event, this);
    });

    this.lastActivityTimeSub.next(null);
  }
}
