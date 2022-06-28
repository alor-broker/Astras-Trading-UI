import { Injectable } from '@angular/core';
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class ActivityTrackerService implements EventListenerObject {
  private readonly eventsToTrack = ['mousemove', 'scroll', 'keydown', 'touchmove'];
  private readonly lastActivityTimeSub = new BehaviorSubject<number | null>(new Date().getTime());
  public readonly lastActivityUnixTime$ = this.lastActivityTimeSub.asObservable();

  constructor() {
  }

  handleEvent(): void {
    this.lastActivityTimeSub.next(new Date().getTime());
  }

  startTracking() {
    this.clearEventListeners();
    this.setupEventListeners();
  }

  stopTracking() {
    this.clearEventListeners();
  }

  private setupEventListeners() {
    this.eventsToTrack.forEach(event => {
      window.addEventListener(event, this);
    });
  }

  private clearEventListeners() {
    this.eventsToTrack.forEach(event => {
      window.removeEventListener(event, this);
    });

    this.lastActivityTimeSub.next(null);
  }
}
